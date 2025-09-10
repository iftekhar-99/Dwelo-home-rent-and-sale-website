import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Common
import Login from "./pages/common/login";
import Registration from "./pages/common/reg";
import Home from "./pages/common/home";
import Messages from "./pages/common/Messages";
import PropertyDetails from "./pages/common/PropertyDetails";

// Admin
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProfileSettings from "./pages/admin/AdminProfileSettings";

// Owner
import OwnerLogin from "./pages/owner/OwnerLogin";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerRequests from "./pages/owner/OwnerRequests";
import CreateProperty from "./pages/owner/CreateProperty";
import EditProperty from "./pages/owner/EditProperty";
import MyProperties from "./pages/owner/MyProperties";
import MyListings from "./pages/owner/MyListings";
import OwnerProfile from "./pages/owner/OwnerProfile";

// User (buyer / renter share same pages)
import UserDashboard from "./pages/user/UserDashboard";
import UserRequests from "./pages/user/UserRequests";
import Wishlist from "./pages/user/Wishlist";
import BuyerPropertyDetails from "./pages/user/BuyerPropertyDetails";
import UserProfile from "./pages/user/UserProfile";

import "./App.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Common */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reg" element={<Registration />} />
          <Route path="/home" element={<Home />} />
          <Route path="/messages" element={<Messages />} />

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/profile" element={<AdminProfileSettings />} />

          {/* Owner */}
          <Route path="/owner/login" element={<OwnerLogin />} />
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/requests" element={<OwnerRequests />} />
          <Route path="/owner/create-property" element={<CreateProperty />} />
          <Route path="/owner/edit-property/:id" element={<EditProperty />} />
          <Route path="/owner/property/:id" element={<PropertyDetails />} />
          <Route path="/owner/properties" element={<MyProperties />} />
          <Route path="/owner/listings" element={<MyListings />} />
          <Route path="/owner/profile" element={<OwnerProfile />} />

          {/* Buyer */}
          <Route path="/buyer/dashboard" element={<UserDashboard />} />
          <Route path="/buyer/requests" element={<UserRequests />} />
          <Route path="/buyer/wishlist" element={<Wishlist />} />
          <Route path="/buyer/property/:id" element={<BuyerPropertyDetails />} />
          <Route path="/buyer/profile" element={<UserProfile />} />

          {/* Renter */}
          <Route path="/renter/dashboard" element={<UserDashboard />} />
          <Route path="/renter/requests" element={<UserRequests />} />
          <Route path="/renter/wishlist" element={<Wishlist />} />
          <Route path="/renter/property/:id" element={<BuyerPropertyDetails />} />
          <Route path="/renter/profile" element={<UserProfile />} />

          {/* Catch-all: redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
