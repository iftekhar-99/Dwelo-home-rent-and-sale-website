import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dwelo');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create super admin function
const createSuperAdmin = async (adminData) => {
  try {
    const { name, email, password, adminLevel = 'super_admin' } = adminData;

    // Validate required fields
    if (!name || !email || !password) {
      throw new Error('Name, email, and password are required');
    }

    // Check if admin already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('Admin with this email already exists');
    }

    // Create user document
    const user = new User({
      name,
      email,
      password,
      role: 'admin',
      isEmailVerified: true,
      isActive: true
    });

    await user.save();
    console.log('✅ User document created');

    // Create admin document
    const admin = new Admin({
      userId: user._id,
      adminLevel,
      permissions: [
        'user_management',
        'property_management',
        'verification_management',
        'payment_management',
        'report_management',
        'system_settings',
        'analytics_view',
        'content_moderation'
      ]
    });

    await admin.save();
    console.log('✅ Admin document created');

    console.log('🎉 Super admin created successfully!');
    console.log('📧 Email:', email);
    console.log('👤 Name:', name);
    console.log('🔑 Admin Level:', adminLevel);
    console.log('🆔 User ID:', user._id);
    console.log('🆔 Admin ID:', admin._id);

    return { user, admin };
  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    throw error;
  }
};

// Create regular admin function
const createAdmin = async (adminData) => {
  try {
    const { name, email, password, adminLevel = 'admin', permissions = [] } = adminData;

    // Validate required fields
    if (!name || !email || !password) {
      throw new Error('Name, email, and password are required');
    }

    // Check if admin already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('Admin with this email already exists');
    }

    // Create user document
    const user = new User({
      name,
      email,
      password,
      role: 'admin',
      isEmailVerified: true,
      isActive: true
    });

    await user.save();
    console.log('✅ User document created');

    // Create admin document with custom permissions
    const admin = new Admin({
      userId: user._id,
      adminLevel,
      permissions: permissions.length > 0 ? permissions : [
        'user_management',
        'property_management',
        'verification_management',
        'payment_management',
        'report_management',
        'analytics_view',
        'content_moderation'
      ]
    });

    await admin.save();
    console.log('✅ Admin document created');

    console.log('🎉 Admin created successfully!');
    console.log('📧 Email:', email);
    console.log('👤 Name:', name);
    console.log('🔑 Admin Level:', adminLevel);
    console.log('🆔 User ID:', user._id);
    console.log('🆔 Admin ID:', admin._id);

    return { user, admin };
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    throw error;
  }
};

// List all admins function
const listAdmins = async () => {
  try {
    const admins = await Admin.find().populate('userId', 'name email role isActive');
    
    console.log('📋 All Admins:');
    console.log('================');
    
    if (admins.length === 0) {
      console.log('No admins found');
      return;
    }

    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.userId.name} (${admin.userId.email})`);
      console.log(`   Role: ${admin.userId.role}`);
      console.log(`   Admin Level: ${admin.adminLevel}`);
      console.log(`   Status: ${admin.userId.isActive ? 'Active' : 'Inactive'}`);
      console.log(`   Permissions: ${admin.permissions.join(', ')}`);
      console.log('---');
    });
  } catch (error) {
    console.error('❌ Error listing admins:', error.message);
  }
};

// Main function
const main = async () => {
  await connectDB();

  const command = process.argv[2];
  const email = process.argv[3];
  const password = process.argv[4];
  const name = process.argv[5];
  const adminLevel = process.argv[6];

  try {
    switch (command) {
      case 'create-super':
        if (!email || !password || !name) {
          console.log('Usage: node createAdmin.js create-super <email> <password> <name>');
          process.exit(1);
        }
        await createSuperAdmin({ name, email, password, adminLevel });
        break;

      case 'create':
        if (!email || !password || !name) {
          console.log('Usage: node createAdmin.js create <email> <password> <name> [adminLevel]');
          process.exit(1);
        }
        await createAdmin({ name, email, password, adminLevel });
        break;

      case 'list':
        await listAdmins();
        break;

      default:
        console.log('Available commands:');
        console.log('  create-super <email> <password> <name> - Create a super admin');
        console.log('  create <email> <password> <name> [adminLevel] - Create a regular admin');
        console.log('  list - List all admins');
        console.log('');
        console.log('Examples:');
        console.log('  node createAdmin.js create-super admin@dwelo.com Password123 "Super Admin"');
        console.log('  node createAdmin.js create moderator@dwelo.com Password123 "Moderator" moderator');
        console.log('  node createAdmin.js list');
    }
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the script
if (require.main === module) {
  main();
}

export { createSuperAdmin, createAdmin, listAdmins };