const mongoose = require('mongoose');
const Superadmin = require('../models/Superadmin');

async function seedSuperadmin() {
  try {
    // Check if superadmin already exists
    const existingSuperadmin = await Superadmin.findOne({ email: 'superadmin@example.com' });
    if (existingSuperadmin) {
      console.log('Superadmin already exists');
      return;
    }

    // Create superadmin data
    const superadminData = {
      name: 'Super Admin',
      email: 'superadmin@example.com',
      password: 'SecurePassword123!',
      phoneNumber: '+1234567890',
      address: '123 Admin Street, Admin City',
      role: 'Superadmin',
    };

    // Save superadmin to database
    await Superadmin.create(superadminData);

    console.log('Superadmin seeded successfully');
  } catch (error) {
    console.error('Error seeding superadmin:', error);
    throw error;
  }
}

module.exports = seedSuperadmin;