import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ChatButton } from '../../components/chat';
import { FaHome, FaHeart, FaSignOutAlt, FaEnvelope, FaUserCircle } from 'react-icons/fa';
import UserProfile from './UserProfile';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    listingType: '',
    minPrice: '',
    maxPrice: '',
    minBedrooms: '',
    maxBedrooms: '',
    city: '',
    state: '',
    zipCode: '',
    propertyType: '',
    minArea: '',
    maxArea: '',
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
      
      fetchProperties({});
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  }, [navigate]);

  const fetchProperties = async (currentFilters) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/properties', {
        params: currentFilters,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data && response.data.data) {
        setProperties(response.data.data);
        // Don't set filteredProperties here - let the search useEffect handle it
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

  // Filter properties based on search query
  useEffect(() => {
    if (!properties || properties.length === 0) {
      setFilteredProperties([]);
      return;
    }
    
    if (!searchQuery.trim()) {
      setFilteredProperties(properties);
    } else {
      const filtered = properties.filter(property => {
        try {
          const searchLower = searchQuery.toLowerCase();
          return (
            (property.title && property.title.toLowerCase().includes(searchLower)) ||
            (property.description && property.description.toLowerCase().includes(searchLower)) ||
            (property.location?.address && property.location.address.toLowerCase().includes(searchLower)) ||
            (property.location?.city && property.location.city.toLowerCase().includes(searchLower)) ||
            (property.location?.state && property.location.state.toLowerCase().includes(searchLower)) ||
            (property.propertyType && property.propertyType.toLowerCase().includes(searchLower))
          );
        } catch (error) {
          console.error('Error filtering property:', property, error);
          return false;
        }
      });
      setFilteredProperties(filtered);
    }
  }, [searchQuery, properties]);
  
  const viewPropertyDetails = (property) => {
    // Navigate to the dedicated property details page instead of showing modal
    const userRole = user?.role || 'buyer';
    navigate(`/${userRole}/property/${property._id}`);
  };

  const clearFilters = () => {
    const clearedFilters = {
      listingType: '',
      minPrice: '',
      maxPrice: '',
      minBedrooms: '',
      maxBedrooms: '',
      city: '',
      state: '',
      zipCode: '',
      propertyType: '',
      minArea: '',
      maxArea: '',
    };
    setFilters(clearedFilters);
    setSearchQuery('');
    fetchProperties(clearedFilters);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      fetchProperties(newFilters);
      return newFilters;
    });
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
    { icon: <FaHome />, text: 'Dashboard', path: user?.role === 'buyer' ? '/buyer/dashboard' : '/renter/dashboard' },
    { icon: <FaUserCircle />, text: 'Profile', path: `/${user?.role}/profile` },
    { icon: <FaHeart />, text: 'Wishlist', path: `/${user?.role}/wishlist` },
    { icon: <FaEnvelope />, text: 'My Requests', path: `/${user?.role}/requests` },
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
          
          <div className="header-actions">
            <ChatButton />
          </div>
        </header>

      <main className="main-content">
        
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
          
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search properties by title, location, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
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
                    <option value="rent">For Rent</option>
                    <option value="sale">For Sale</option>
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
                  <label htmlFor="propertyType">Property Type</label>
                  <select 
                    id="propertyType" 
                    value={filters.propertyType} 
                    onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                  >
                    <option value="">Any</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="villa">Villa</option>
                    <option value="land">Land</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="minArea">Min Area (sq ft)</label>
                  <input 
                    type="number" 
                    id="minArea" 
                    value={filters.minArea} 
                    onChange={(e) => handleFilterChange('minArea', e.target.value)}
                    placeholder="Min Area"
                  />
                </div>

                <div className="filter-group">
                  <label htmlFor="maxArea">Max Area (sq ft)</label>
                  <input 
                    type="number" 
                    id="maxArea" 
                    value={filters.maxArea} 
                    onChange={(e) => handleFilterChange('maxArea', e.target.value)}
                    placeholder="Max Area"
                  />
                </div>




              </div>
              <div className="filter-actions">
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
