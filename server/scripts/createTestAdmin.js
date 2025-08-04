import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Import models
import User from '../models/User.js';
import Admin from '../models/Admin.js';

async function createTestAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dwelo');
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@dwelo.com';
    const adminPassword = 'AdminPass123!';
    const adminName = 'Test Admin';

    // Check if admin already exists
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      console.log('Admin user already exists:', adminEmail);
      
      // Check if admin record exists
      const existingAdmin = await Admin.findOne({ userId: existingUser._id });
      if (existingAdmin) {
        console.log('Admin record already exists');
        console.log('Admin Level:', existingAdmin.adminLevel);
        console.log('Permissions:', existingAdmin.permissions);
        console.log('Is Active:', existingAdmin.isActive);
      } else {
        console.log('Creating admin record for existing user...');
        const adminRecord = new Admin({
          userId: existingUser._id,
          adminLevel: 'super_admin',
          isActive: true
        });
        await adminRecord.save();
        console.log('Admin record created successfully');
      }
      
      console.log('\nTest Admin Credentials:');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
      console.log('\nYou can now login at: http://localhost:5173/admin/login');
      
    } else {
      // Create new admin user
      console.log('Creating new admin user...');
      
      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      // Create user with hashed password (bypass validation)
      const user = new User({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        isEmailVerified: true
      });
      
      // Save without validation since password is already hashed
      await user.save({ validateBeforeSave: false });
      console.log('User created successfully');
      
      // Create admin record
      const admin = new Admin({
        userId: user._id,
        adminLevel: 'super_admin',
        isActive: true
      });
      
      await admin.save();
      console.log('Admin record created successfully');
      
      console.log('\nTest Admin Created Successfully!');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
      console.log('Admin Level: super_admin');
      console.log('Permissions: All permissions granted');
      console.log('\nYou can now login at: http://localhost:5173/admin/login');
    }

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestAdmin(); 