const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Superadmin = require('../models/Superadmin');
const Auth = require('../models/Auth');

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
      phoneNumber: '+1234567890',
      address: '123 Admin Street, Admin City',
      role: 'Superadmin',
    };

    // Save superadmin to database
    const superadmin = await Superadmin.create(superadminData);

    // Create corresponding auth record
    const hashedPassword = await bcrypt.hash('SecurePassword123!', 10);
    await Auth.create({
      email: superadminData.email,
      password: hashedPassword,
      id_person: superadmin._id,
      id_person_model: 'Superadmin',
    });

    console.log('Superadmin seeded successfully');
  } catch (error) {
    console.error('Error seeding superadmin:', error);
  }
}

module.exports = seedSuperadmin;