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
      userId = userCheck.rows[0].id; // Reusing pending user
      // Optionally update the password hash here if they changed it during retry
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
    } else {
      // Create new pending user
      const orgCheck = await client.query('SELECT id FROM organizations WHERE name = $1 LIMIT 1', ['Default Organization']);
      let orgId;
      if (orgCheck.rows.length === 0) {
        const newOrg = await client.query("INSERT INTO organizations (name, billing_email) VALUES ('Default Organization', 'admin@example.com') RETURNING id");
        orgId = newOrg.rows[0].id;
      } else {
        orgId = orgCheck.rows[0].id;
      }

      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      const empResult = await client.query(queries.createEmployee, [orgId, firstName, lastName, email.trim().toLowerCase()]);
      const employeeId = empResult.rows[0].id;

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const userResult = await client.query("INSERT INTO users (organization_id, employee_id, email, password_hash, status) VALUES ($1, $2, $3, $4, 'PENDING_VERIFICATION') RETURNING id", [
        orgId, employeeId, email.trim().toLowerCase(), passwordHash
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

    // Optionally issue JWT directly so they don't have to login again
    const tokenPayload = { user: { id: user.id, organization_id: user.organization_id, employee_id: user.employee_id } };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' });

    // Fetch full user details for the frontend state
    const fullUserCheck = await client.query(queries.getUserByEmailAndOrg, [user.email, user.organization_id]);
    const fullUser = fullUserCheck.rows[0];

    res.status(200).json({
      success: true,
      token,
      user: { id: fullUser.id, email: fullUser.email, fullName: `${fullUser.first_name} ${fullUser.last_name}`.trim(), employeeId: fullUser.employee_id, role: 'ADMIN' }
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
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        organization_id: user.organization_id,
        employee_id: user.employee_id
      }
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: `${user.first_name} ${user.last_name}`.trim(),
        employeeId: user.employee_id,
        role: 'ADMIN' // Hardcoded for hackathon, usually fetched from user_roles
      }
    });
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
    } else if (workspaces.length === 1) {
      const orgId = workspaces[0].id;
      const userRes = await db.query(queries.getUserByEmailAndOrg, [email, orgId]);
      const user = userRes.rows[0];

      const tokenPayload = { user: { id: user.id, organization_id: user.organization_id, employee_id: user.employee_id } };
      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' });

      return res.status(200).json({
        success: true,
        action: 'LOGIN',
        token,
        user: { id: user.id, email: user.email, fullName: `${user.first_name} ${user.last_name}`.trim(), employeeId: user.employee_id, role: 'ADMIN' }
      });
    } else {
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

    const empRes = await client.query(queries.createEmployee, [orgId, firstName, lastName, email]);
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

module.exports = {
  register,
  verifyRegistrationOtp,
  login,
  googleAuth,
  googleSelectWorkspace,
  googleCreateWorkspace
};
