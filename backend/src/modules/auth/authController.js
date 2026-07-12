const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');
const queries = require('./authQueries');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

const { sendOTP } = require('../../utils/emailService');

const register = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { fullName, email, password } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, error: 'Please provide all fields' });
    }

    await client.query('BEGIN');

    // Check if user exists and is active
    const userCheck = await client.query(queries.getUserByEmail, [email.trim().toLowerCase()]);
    if (userCheck.rows.length > 0 && userCheck.rows[0].status === 'ACTIVE') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'User already exists and is active.' });
    }

    let userId;
    if (userCheck.rows.length > 0) {
      userId = userCheck.rows[0].id;
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
    } else {
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create employee with no organization yet
      const empResult = await client.query(queries.createEmployee, [null, firstName, lastName, email.trim().toLowerCase(), 'ADMIN']);
      const employeeId = empResult.rows[0].id;

      // Create new pending user with no organization
      const userResult = await client.query("INSERT INTO users (employee_id, email, password_hash, status) VALUES ($1, $2, $3, 'PENDING_VERIFICATION') RETURNING id", [
        employeeId, email.trim().toLowerCase(), passwordHash
      ]);
      userId = userResult.rows[0].id;
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 mins

    // Clear old OTPs for this user
    await client.query('DELETE FROM otp WHERE user_id = $1', [userId]);

    // Insert new OTP
    await client.query('INSERT INTO otp (user_id, code, expires_at) VALUES ($1, $2, $3)', [userId, otpCode, expiresAt]);

    await client.query('COMMIT');

    // Send email asynchronously
    sendOTP(email.trim().toLowerCase(), otpCode).catch(console.error);

    res.status(200).json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in register:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  } finally {
    client.release();
  }
};

const verifyRegistrationOtp = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, error: 'Email and OTP required' });

    await client.query('BEGIN');

    // Find pending user
    const userCheck = await client.query("SELECT * FROM users WHERE email = $1 AND status = 'PENDING_VERIFICATION'", [email.trim().toLowerCase()]);
    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Registration session not found or already verified.' });
    }
    const user = userCheck.rows[0];

    // Verify OTP
    const otpCheck = await client.query("SELECT * FROM otp WHERE user_id = $1 AND code = $2 AND used = false AND expires_at > CURRENT_TIMESTAMP", [user.id, otp]);
    if (otpCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    // Mark used
    await client.query('UPDATE otp SET used = true WHERE id = $1', [otpCheck.rows[0].id]);

    // Activate User
    await client.query("UPDATE users SET status = 'ACTIVE' WHERE id = $1", [user.id]);

    await client.query('COMMIT');

    // If they have no organization, send them to Workspace Portal
    if (!user.organization_id) {
      const setupToken = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '15m' });
      return res.status(200).json({
        success: true,
        action: 'CREATE_WORKSPACE',
        setupToken,
        user: { id: user.id, email: user.email }
      });
    }

    // Otherwise, log them into their organization
    const tokenPayload = { user: { id: user.id, organization_id: user.organization_id, employee_id: user.employee_id } };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' });

    const fullUserCheck = await client.query(queries.getUserByEmailAndOrg, [user.email, user.organization_id]);
    const fullUser = fullUserCheck.rows[0] || user;

    res.status(200).json({
      success: true,
      token,
      user: { id: fullUser.id, email: fullUser.email, fullName: `${fullUser.first_name || ''} ${fullUser.last_name || ''}`.trim(), employeeId: fullUser.employee_id, role: fullUser.computed_role }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in verify otp:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  } finally {
    client.release();
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    const { rows } = await db.query(queries.getUserByEmail, [email.trim().toLowerCase()]);
    
    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const workspacesRes = await db.query(queries.getWorkspacesByEmail, [email.trim().toLowerCase()]);
    const workspaces = workspacesRes.rows;

    const setupToken = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '15m' });

    if (workspaces.length === 0) {
      return res.status(200).json({
        success: true,
        action: 'CREATE_WORKSPACE',
        setupToken,
        user: { email: user.email, fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() }
      });
    } else {
      return res.status(200).json({
        success: true,
        action: 'SELECT_WORKSPACE',
        workspaces,
        setupToken,
        user: { email: user.email, fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() }
      });
    }
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);

const googleAuth = async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ success: false, error: 'No credential provided' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email.trim().toLowerCase();
    const fullName = payload.name;
    const picture = payload.picture;

    const workspacesRes = await db.query(queries.getWorkspacesByEmail, [email]);
    const workspaces = workspacesRes.rows;

    if (workspaces.length === 0) {
      return res.status(200).json({
        success: true,
        action: 'CREATE_WORKSPACE',
        user: { email, fullName, picture }
      });
    } else {
      // Always show Workspace Portal if they have 1 or more workspaces, Slack style!
      return res.status(200).json({
        success: true,
        action: 'SELECT_WORKSPACE',
        workspaces,
        user: { email, fullName, picture }
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(401).json({ success: false, error: 'Invalid Google Token' });
  }
};

const googleSelectWorkspace = async (req, res) => {
  const { credential, organizationId } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const email = ticket.getPayload().email.trim().toLowerCase();

    const userRes = await db.query(queries.getUserByEmailAndOrg, [email, organizationId]);
    const user = userRes.rows[0];
    if (!user) return res.status(401).json({ success: false, error: 'User not in this organization' });

    const tokenPayload = { user: { id: user.id, organization_id: user.organization_id, employee_id: user.employee_id } };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' });

    return res.status(200).json({
      success: true,
      token,
      user: { id: user.id, email: user.email, fullName: `${user.first_name} ${user.last_name}`.trim(), employeeId: user.employee_id, role: 'ADMIN' }
    });
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

const googleCreateWorkspace = async (req, res) => {
  const { credential, organizationName } = req.body;
  const client = await db.pool.connect();
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const email = payload.email.trim().toLowerCase();
    const nameParts = (payload.name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    await client.query('BEGIN');

    const orgRes = await client.query(queries.createOrganization, [organizationName, email]);
    const orgId = orgRes.rows[0].id;

    const empRes = await client.query(queries.createEmployee, [orgId, firstName, lastName, email, 'ADMIN']);
    const employeeId = empRes.rows[0].id;

    const userRes = await client.query(queries.createUser, [orgId, employeeId, email, 'GOOGLE_AUTH']);
    const user = userRes.rows[0];

    await client.query('COMMIT');

    const tokenPayload = { user: { id: user.id, organization_id: user.organization_id, employee_id: user.employee_id } };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, email: user.email, fullName: payload.name, employeeId: user.employee_id, role: 'ADMIN' }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  } finally {
    client.release();
  }
};

const createWorkspace = async (req, res) => {
  const { setupToken, organizationName } = req.body;
  const client = await db.pool.connect();
  try {
    const decoded = jwt.verify(setupToken, JWT_SECRET);
    const email = decoded.email.trim().toLowerCase();

    await client.query('BEGIN');

    // Get the unaffiliated user
    const userRes = await client.query('SELECT u.*, e.first_name, e.last_name FROM users u LEFT JOIN employees e ON u.employee_id = e.id WHERE u.email = $1 AND u.deleted_at IS NULL LIMIT 1', [email]);
    const user = userRes.rows[0];

    if (!user) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.organization_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'User already has an organization' });
    }

    // Create Organization
    const orgRes = await client.query(queries.createOrganization, [organizationName, email]);
    const orgId = orgRes.rows[0].id;

    // Update Employee with orgId
    if (user.employee_id) {
      await client.query('UPDATE employees SET organization_id = $1 WHERE id = $2', [orgId, user.employee_id]);
    } else {
       // if no employee record for some reason (e.g. google auth that didn't create one)
       const empRes = await client.query(queries.createEmployee, [orgId, user.first_name || '', user.last_name || '', email, 'ADMIN']);
       const employeeId = empRes.rows[0].id;
       await client.query('UPDATE users SET employee_id = $1 WHERE id = $2', [employeeId, user.id]);
       user.employee_id = employeeId;
    }

    // Update User with orgId
    await client.query('UPDATE users SET organization_id = $1 WHERE id = $2', [orgId, user.id]);

    await client.query('COMMIT');

    const tokenPayload = { user: { id: user.id, organization_id: orgId, employee_id: user.employee_id } };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, email: user.email, fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(), employeeId: user.employee_id, role: 'ADMIN' }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating workspace:', err);
    res.status(500).json({ success: false, error: 'Server Error or Invalid Token' });
  } finally {
    client.release();
  }
};

const selectWorkspace = async (req, res) => {
  const { setupToken, organizationId } = req.body;
  try {
    const decoded = jwt.verify(setupToken, JWT_SECRET);
    const email = decoded.email.trim().toLowerCase();

    const userRes = await db.query(queries.getUserByEmailAndOrg, [email, organizationId]);
    const user = userRes.rows[0];
    if (!user) return res.status(401).json({ success: false, error: 'User not in this organization' });

    const tokenPayload = { user: { id: user.id, organization_id: user.organization_id, employee_id: user.employee_id } };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' });

    return res.status(200).json({
      success: true,
      token,
      user: { id: user.id, email: user.email, fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(), employeeId: user.employee_id, role: user.computed_role }
    });
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

module.exports = {
  register,
  verifyRegistrationOtp,
  login,
  googleAuth,
  googleSelectWorkspace,
  googleCreateWorkspace,
  createWorkspace,
  selectWorkspace
};
