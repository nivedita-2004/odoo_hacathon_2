require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Module Routes

const authRoutes = require('./modules/auth/authRoutes');
const dashboardRoutes = require('./modules/dashboard/dashboardRoutes');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
