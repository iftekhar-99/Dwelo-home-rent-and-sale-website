import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/common/login';
import Registration from './pages/common/reg';
import Home from './pages/common/home';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProfileSettings from './pages/admin/AdminProfileSettings';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerLogin from './pages/owner/OwnerLogin';
import OwnerRequests from './pages/owner/OwnerRequests';
import CreateProperty from './pages/owner/CreateProperty';
import EditProperty from './pages/owner/EditProperty';
import PropertyDetails from './pages/common/PropertyDetails';
import BuyerPropertyDetails from './pages/user/BuyerPropertyDetails';
import MyProperties from './pages/owner/MyProperties';
import MyListings from './pages/owner/MyListings';
import UserDashboard from './pages/user/UserDashboard';
import UserRequests from './pages/user/UserRequests';
import Wishlist from './pages/user/Wishlist';
import Messages from './pages/common/Messages';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reg" element={<Registration />} />
          <Route path="/home" element={<Home />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/profile" element={<AdminProfileSettings />} />
          <Route path="/owner/login" element={<OwnerLogin />} />
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/requests" element={<OwnerRequests />} />
          <Route path="/owner/create-property" element={<CreateProperty />} />
          <Route path="/owner/edit-property/:id" element={<EditProperty />} />
          <Route path="/owner/property/:id" element={<PropertyDetails />} />
          <Route path="/owner/properties" element={<MyProperties />} />
          <Route path="/owner/listings" element={<MyListings />} />
          <Route path="/buyer/userdashboard" element={<UserDashboard />} />
          <Route path="/buyer/requests" element={<UserRequests />} />
          <Route path="/buyer/wishlist" element={<Wishlist />} />
          <Route path="/buyer/property/:id" element={<BuyerPropertyDetails />} />
          <Route path="/renter/userdashboard" element={<UserDashboard />} />
          <Route path="/renter/requests" element={<UserRequests />} />
          <Route path="/renter/wishlist" element={<Wishlist />} />
          <Route path="/renter/property/:id" element={<BuyerPropertyDetails />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
