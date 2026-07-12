require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Module Routes

const authRoutes = require('./modules/auth/authRoutes');
const dashboardRoutes = require('./modules/dashboard/dashboardRoutes');
const organizationRoutes = require('./modules/organization/organizationRoutes');

const app = express();
const port = process.env.PORT || 5000;

app.set('trust proxy', 1); // Trust first proxy for rate limiting

app.use(cors());
app.use(express.json());

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { success: false, error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api', limiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

const assetRoutes = require('./modules/assets/assetRoutes');
const allocationRoutes = require('./modules/allocations/allocationRoutes');
const bookingRoutes = require('./modules/bookings/bookingRoutes');
const maintenanceRoutes = require('./modules/maintenance/maintenanceRoutes');
const auditRoutes = require('./modules/audits/auditRoutes');
const reportsRoutes = require('./modules/reports/reportsRoutes');
const notificationsRoutes = require('./modules/notifications/notificationsRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
