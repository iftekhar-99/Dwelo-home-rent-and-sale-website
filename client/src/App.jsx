import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Registration from './pages/reg';
import Home from './pages/home';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminProfileSettings from './pages/AdminProfileSettings';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerLogin from './pages/OwnerLogin';
import CreateProperty from './pages/CreateProperty';
import PropertyDetails from './pages/PropertyDetails';
import MyProperties from './pages/MyProperties';
import UserDashboard from './pages/UserDashboard';
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
          <Route path="/owner/create-property" element={<CreateProperty />} />
          <Route path="/owner/property/:id" element={<PropertyDetails />} />
          <Route path="/owner/properties" element={<MyProperties />} />
          <Route path="/buyer/userdashboard" element={<UserDashboard />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
