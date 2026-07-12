require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Module Routes

const authRoutes = require('./modules/auth/authRoutes');
const dashboardRoutes = require('./modules/dashboard/dashboardRoutes');
const organizationRoutes = require('./modules/organization/organizationRoutes');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

const assetRoutes = require('./modules/assets/assetRoutes');
const allocationRoutes = require('./modules/allocations/allocationRoutes');
const bookingRoutes = require('./modules/bookings/bookingRoutes');
const maintenanceRoutes = require('./modules/maintenance/maintenanceRoutes');
const auditRoutes = require('./modules/audits/auditRoutes');
const reportsRoutes = require('./modules/reports/reportsRoutes');

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


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
