import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Registration from './pages/reg';
import Home from './pages/home';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminProfileSettings from './pages/AdminProfileSettings';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerLogin from './pages/OwnerLogin';
import OwnerRequests from './pages/OwnerRequests';
import CreateProperty from './pages/CreateProperty';
import EditProperty from './pages/EditProperty';
import PropertyDetails from './pages/PropertyDetails';
import BuyerPropertyDetails from './pages/BuyerPropertyDetails';
import MyProperties from './pages/MyProperties';
import MyListings from './pages/MyListings';
import UserDashboard from './pages/UserDashboard';
import UserRequests from './pages/UserRequests';
import Wishlist from './pages/Wishlist';
import Messages from './pages/Messages';
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
