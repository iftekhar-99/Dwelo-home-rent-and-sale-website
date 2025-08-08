import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ChatButton } from '../components/chat';
import { FaHome, FaList, FaHeart, FaUser, FaSignOutAlt, FaEnvelope } from 'react-icons/fa';
import './UserDashboard.css';

const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    preferences: {}
  });
  const [filters, setFilters] = useState({
    listingType: '',
    minPrice: '',
    maxPrice: '',
    minBedrooms: '',
    maxBedrooms: '',
    city: '',
    state: '',
    zipCode: '',
    minYearBuilt: '',
    maxYearBuilt: '',
    amenities: []
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Initialize profile data
      setProfileData({
        name: parsedUser.name || '',
        email: parsedUser.email || '',
        phone: parsedUser.phone || '',
        preferences: parsedUser.preferences || {}
      });
      
      // Redirect if not a buyer or renter
      if (parsedUser.role !== 'buyer' && parsedUser.role !== 'renter') {
        if (parsedUser.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (parsedUser.role === 'owner') {
          navigate('/owner/dashboard');
        } else {
          navigate('/login');
        }
        return;
      }
      
      fetchProperties();
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  }, [navigate]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/properties');
      
      if (response.data && response.data.data) {
        // Filter only approved properties
        const approvedProperties = response.data.data.filter(property => property.status === 'approved');
        setProperties(approvedProperties);
        setFilteredProperties(approvedProperties);
      } else {
        console.error('Invalid response format:', response.data);
        setProperties([]);
        setFilteredProperties([]);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
      setFilteredProperties([]);
    } finally {
      setLoading(false);
    }
  };
  
  const viewPropertyDetails = (property) => {
    // Navigate to the dedicated property details page instead of showing modal
    const userRole = user?.role || 'buyer';
    navigate(`/${userRole}/property/${property._id}`);
  };



  const applyFilters = () => {
    let filtered = [...properties];

    if (filters.listingType) {
      filtered = filtered.filter(property => property.listingType === filters.listingType);
    }

    if (filters.minPrice) {
      filtered = filtered.filter(property => property.price >= parseInt(filters.minPrice));
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(property => property.price <= parseInt(filters.maxPrice));
    }

    if (filters.minBedrooms) {
      filtered = filtered.filter(property => property.details.bedrooms >= parseInt(filters.minBedrooms));
    }

    if (filters.maxBedrooms) {
      filtered = filtered.filter(property => property.details.bedrooms <= parseInt(filters.maxBedrooms));
    }

    if (filters.city) {
      filtered = filtered.filter(property => 
        property.location.address.city.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    if (filters.state) {
      filtered = filtered.filter(property => 
        property.location.address.state.toLowerCase().includes(filters.state.toLowerCase())
      );
    }

    if (filters.zipCode) {
      filtered = filtered.filter(property => 
        property.location.address.zipCode.includes(filters.zipCode)
      );
    }

    if (filters.minYearBuilt) {
      filtered = filtered.filter(property => property.details.yearBuilt >= parseInt(filters.minYearBuilt));
    }

    if (filters.maxYearBuilt) {
      filtered = filtered.filter(property => property.details.yearBuilt <= parseInt(filters.maxYearBuilt));
    }

    if (filters.amenities.length > 0) {
      filtered = filtered.filter(property => 
        filters.amenities.every(amenity => property.amenities.includes(amenity))
      );
    }

    setFilteredProperties(filtered);
  };

  const clearFilters = () => {
    setFilters({
      listingType: '',
      minPrice: '',
      maxPrice: '',
      minBedrooms: '',
      maxBedrooms: '',
      city: '',
      state: '',
      zipCode: '',
      minYearBuilt: '',
      maxYearBuilt: '',
      amenities: []
    });
    setFilteredProperties(properties);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleAmenityToggle = (amenity) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const toggleProfileEdit = () => {
    setShowProfileEdit(!showProfileEdit);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveProfile = async () => {
    try {
      // In a real application, you would send this data to the server
      // For now, we'll just update the local storage
      const updatedUser = {
        ...user,
        name: profileData.name,
        phone: profileData.phone,
        preferences: profileData.preferences
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setShowProfileEdit(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  // Define sidebar links based on user role
  const sidebarLinks = [
    { icon: <FaHome />, text: 'Dashboard', path: user?.role === 'buyer' ? '/buyer/userdashboard' : '/renter/userdashboard' },
    { icon: <FaList />, text: 'Properties', path: user?.role === 'buyer' ? '/buyer/userdashboard' : '/renter/userdashboard' },
    { icon: <FaHeart />, text: 'Wishlist', path: user?.role === 'buyer' ? '/buyer/wishlist' : '/renter/wishlist' },
    { icon: <FaEnvelope />, text: 'My Requests', path: user?.role === 'buyer' ? '/buyer/requests' : '/renter/requests' },
    { icon: <FaUser />, text: 'Profile', path: user?.role === 'buyer' ? '/buyer/profile' : '/renter/profile' }
  ];

  return (
    <div className="user-dashboard">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <img src="/logo.png" alt="Dwelo" className="logo" />
          <h2>{user.role === 'buyer' ? 'Buyer Portal' : 'Renter Portal'}</h2>
        </div>
        
        <nav className="sidebar-nav">
          {sidebarLinks.map((link, index) => (
            <Link key={index} to={link.path} className="nav-link">
              {link.icon}
              <span>{link.text}</span>
            </Link>
          ))}
          <button className="nav-link logout-button" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <div className="dashboard-content">
        <header className="dashboard-header">
          <div className="header-search">
            <input type="search" placeholder="Search properties..." />
          </div>
          
          <div className="header-actions">
            <ChatButton />
          </div>
        </header>

      <main className="main-content">
        {/* User Profile Section */}
        <section className="profile-section">
          <div className="profile-header">
            <h2>My Profile</h2>
            <button 
              className="edit-profile-btn" 
              onClick={toggleProfileEdit}
            >
              {showProfileEdit ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>
          
          {showProfileEdit ? (
            <div className="profile-edit-form">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  value={profileData.name} 
                  onChange={handleProfileChange} 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  value={profileData.email} 
                  disabled 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone" 
                  value={profileData.phone} 
                  onChange={handleProfileChange} 
                />
              </div>
              
              <button className="save-profile-btn" onClick={saveProfile}>Save Profile</button>
            </div>
          ) : (
            <div className="profile-info">
              <div className="info-group">
                <span className="info-label">Name:</span>
                <span className="info-value">{user.name}</span>
              </div>
              
              <div className="info-group">
                <span className="info-label">Email:</span>
                <span className="info-value">{user.email}</span>
              </div>
              
              <div className="info-group">
                <span className="info-label">Phone:</span>
                <span className="info-value">{user.phone || 'Not provided'}</span>
              </div>
              
              <div className="info-group">
                <span className="info-label">Role:</span>
                <span className="info-value">{user.role}</span>
              </div>
            </div>
          )}
        </section>
        
        {/* Search and Filter Section */}
        <section className="search-section">
          <div className="search-header">
            <h2>Find Your Perfect Property</h2>
            <button 
              className="filter-toggle-btn" 
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
          
          {showFilters && (
            <div className="filters-container">
              <div className="filters-grid">
                <div className="filter-group">
                  <label htmlFor="listingType">Listing Type</label>
                  <select 
                    id="listingType" 
                    value={filters.listingType} 
                    onChange={(e) => handleFilterChange('listingType', e.target.value)}
                  >
                    <option value="">Any</option>
                    <option value="For Rent">For Rent</option>
                    <option value="For Sale">For Sale</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="minPrice">Min Price</label>
                  <input 
                    type="number" 
                    id="minPrice" 
                    value={filters.minPrice} 
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    placeholder="Min Price"
                  />
                </div>

                <div className="filter-group">
                  <label htmlFor="maxPrice">Max Price</label>
                  <input 
                    type="number" 
                    id="maxPrice" 
                    value={filters.maxPrice} 
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    placeholder="Max Price"
                  />
                </div>

                <div className="filter-group">
                  <label htmlFor="minBedrooms">Min Bedrooms</label>
                  <input 
                    type="number" 
                    id="minBedrooms" 
                    value={filters.minBedrooms} 
                    onChange={(e) => handleFilterChange('minBedrooms', e.target.value)}
                    placeholder="Min Bedrooms"
                  />
                </div>

                <div className="filter-group">
                  <label htmlFor="maxBedrooms">Max Bedrooms</label>
                  <input 
                    type="number" 
                    id="maxBedrooms" 
                    value={filters.maxBedrooms} 
                    onChange={(e) => handleFilterChange('maxBedrooms', e.target.value)}
                    placeholder="Max Bedrooms"
                  />
                </div>

                <div className="filter-group">
                  <label htmlFor="city">City</label>
                  <input 
                    type="text" 
                    id="city" 
                    value={filters.city} 
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    placeholder="City"
                  />
                </div>

                <div className="filter-group">
                  <label htmlFor="state">State</label>
                  <input 
                    type="text" 
                    id="state" 
                    value={filters.state} 
                    onChange={(e) => handleFilterChange('state', e.target.value)}
                    placeholder="State"
                  />
                </div>

                <div className="filter-group">
                  <label htmlFor="zipCode">Zip Code</label>
                  <input 
                    type="text" 
                    id="zipCode" 
                    value={filters.zipCode} 
                    onChange={(e) => handleFilterChange('zipCode', e.target.value)}
                    placeholder="Zip Code"
                  />
                </div>

                <div className="filter-group">
                  <label htmlFor="minYearBuilt">Min Year Built</label>
                  <input 
                    type="number" 
                    id="minYearBuilt" 
                    value={filters.minYearBuilt} 
                    onChange={(e) => handleFilterChange('minYearBuilt', e.target.value)}
                    placeholder="Min Year Built"
                  />
                </div>

                <div className="filter-group">
                  <label htmlFor="maxYearBuilt">Max Year Built</label>
                  <input 
                    type="number" 
                    id="maxYearBuilt" 
                    value={filters.maxYearBuilt} 
                    onChange={(e) => handleFilterChange('maxYearBuilt', e.target.value)}
                    placeholder="Max Year Built"
                  />
                </div>

                <div className="filter-group">
                  <label>Amenities</label>
                  <div className="amenities-checkboxes">
                    {['Pool', 'Gym', 'Parking', 'Garden', 'Balcony', 'Security'].map(amenity => (
                      <label key={amenity}>
                        <input
                          type="checkbox"
                          value={amenity}
                          checked={filters.amenities.includes(amenity)}
                          onChange={() => handleAmenityToggle(amenity)}
                        />
                        {amenity}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="filter-actions">
                <button onClick={applyFilters} className="apply-filters-btn">Apply Filters</button>
                <button onClick={clearFilters} className="clear-filters-btn">Clear Filters</button>
              </div>
            </div>
          )}
        </section>

        {/* Available Properties Section */}
        <section className="properties-section">
          <div className="properties-header">
            <h2>Available Properties ({filteredProperties.length})</h2>
          </div>
          
          {loading ? (
            <div className="loading">Loading properties...</div>
          ) : filteredProperties.length === 0 ? (
            <div className="no-properties">No properties found matching your criteria.</div>
          ) : (
            <div className="properties-grid">
              {filteredProperties.map(property => (
                <div key={property._id} className="property-card">
                  <div className="property-image">
                    {property.images && property.images.length > 0 ? (
                      <img src={`http://localhost:5002${property.images[0].url}`} alt={property.title} />
                    ) : (
                      <div className="placeholder-image">No Image Available</div>
                    )}
                    <div className="property-type-badge">{property.listingType}</div>
                  </div>
                  <div className="property-info">
                    <h3 className="property-title">{property.title}</h3>
                    <div className="property-price">${property.price?.toLocaleString()}</div>
                    <div className="property-location">
                      {property.location?.address?.city}, {property.location?.address?.state}
                    </div>
                    <div className="property-details">
                      <span>{property.details?.bedrooms} Beds</span>
                      <span>{property.details?.bathrooms} Baths</span>
                      <span>{property.details?.area?.size} sq ft</span>
                    </div>
                    <button 
                      onClick={() => viewPropertyDetails(property)}
                      className="view-details-btn"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Property Details Modal removed - now using dedicated page */}
      </main>
      </div>
    </div>
  );


};

export default UserDashboard;
