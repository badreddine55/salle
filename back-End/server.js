const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');
const seedSuperadmin = require('./seeders/superAdminSeeder');
const { scheduleCronJobs } = require('./cron/cronJobs');

// Set time zone to Europe/Paris
process.env.TZ = 'Europe/Paris';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB(); // Connect to MongoDB
    await seedSuperadmin(); // Run superadmin seeder
    scheduleCronJobs(); // Schedule cron jobs
    console.log('Cron jobs scheduled');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();