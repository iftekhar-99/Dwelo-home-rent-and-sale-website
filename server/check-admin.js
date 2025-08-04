import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Import models
import User from './models/User.js';
import Admin from './models/Admin.js';

async function checkAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dwelo');
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@dwelo.com';
    const adminPassword = 'AdminPass123!';

    // Find user
    const user = await User.findOne({ email: adminEmail });
    if (!user) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Admin user found:');
    console.log('- ID:', user._id);
    console.log('- Name:', user.name);
    console.log('- Email:', user.email);
    console.log('- Role:', user.role);
    console.log('- Is Active:', user.isActive);
    console.log('- Password hash:', user.password.substring(0, 20) + '...');

    // Find admin record
    const admin = await Admin.findOne({ userId: user._id });
    if (!admin) {
      console.log('❌ Admin record not found');
      return;
    }

    console.log('\n✅ Admin record found:');
    console.log('- Admin ID:', admin._id);
    console.log('- Admin Level:', admin.adminLevel);
    console.log('- Is Active:', admin.isActive);
    console.log('- Permissions:', admin.permissions);

    // Test password
    console.log('\nTesting password...');
    const isPasswordValid = await bcrypt.compare(adminPassword, user.password);
    console.log('Password valid:', isPasswordValid);

    if (isPasswordValid) {
      console.log('\n✅ Admin credentials are correct!');
    } else {
      console.log('\n❌ Password is incorrect');
    }

  } catch (error) {
    console.error('Error checking admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkAdmin(); 