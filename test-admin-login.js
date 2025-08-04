const axios = require('axios');

async function testAdminLogin() {
  try {
    console.log('Testing Admin Login...\n');
    
    const adminCredentials = {
      email: 'admin@dwelo.com',
      password: 'AdminPass123!'
    };
    
    console.log('Testing admin login with:', adminCredentials.email);
    
    try {
      const loginResponse = await axios.post('http://localhost:5001/api/admin/login', adminCredentials);
      
      if (loginResponse.data.success) {
        console.log('✅ Admin Login successful!');
        console.log('✅ Admin data:', loginResponse.data.data.admin);
        console.log('✅ Token received:', loginResponse.data.data.token ? 'Yes' : 'No');
        
        // Test dashboard access
        console.log('\nTesting dashboard access...');
        const token = loginResponse.data.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        
        const dashboardResponse = await axios.get('http://localhost:5001/api/admin/dashboard', { headers });
        console.log('✅ Dashboard access successful:', dashboardResponse.data.success);
        console.log('✅ Metrics received:', dashboardResponse.data.data ? 'Yes' : 'No');
        
        // Test pending properties access
        console.log('\nTesting pending properties access...');
        const propertiesResponse = await axios.get('http://localhost:5001/api/admin/properties/pending', { headers });
        console.log('✅ Properties access successful:', propertiesResponse.data.success);
        console.log('✅ Properties count:', propertiesResponse.data.data.properties.length);
        
        // Test pending reports access
        console.log('\nTesting pending reports access...');
        const reportsResponse = await axios.get('http://localhost:5001/api/admin/reports/pending', { headers });
        console.log('✅ Reports access successful:', reportsResponse.data.success);
        console.log('✅ Reports count:', reportsResponse.data.data.reports.length);
        
        console.log('\n🎉 All admin functionality tests passed!');
        console.log('\nYou can now access the admin dashboard at: http://localhost:5173/admin/login');
        
      } else {
        console.log('❌ Admin login failed:', loginResponse.data.message);
      }
      
    } catch (error) {
      console.log('❌ Admin Login Error Response:', JSON.stringify(error.response?.data, null, 2));
      console.log('❌ Error Status:', error.response?.status);
      console.log('❌ Error Message:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAdminLogin(); 