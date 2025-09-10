import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaList, FaHeart, FaUser, FaSignOutAlt, FaEnvelope, FaTrash } from 'react-icons/fa';
import { ChatButton } from "../../components/chat";
import './Wishlist.css';

const Wishlist = () => {
  const [user, setUser] = useState(null);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Define sidebar links based on user role
  const sidebarLinks = [
    {icon: <FaHome />, text: 'Dashboard', path: user?.role === 'buyer' ? '/buyer/dashboard' : '/renter/dashboard' },
    { icon: <FaHeart />, text: 'Wishlist', path: user?.role === 'buyer' ? '/buyer/wishlist' : '/renter/wishlist' },
  ];

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
      
      fetchWishlist();
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  }, [navigate]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/wishlist', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setWishlistItems(data.data.wishlist.properties || []);
        console.log('Wishlist API response:', data);
      } else {
        setError(data.message || 'Failed to fetch wishlist');
        console.error('Wishlist API error response:', data);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setError('Failed to connect to server');
    } finally {
        setLoading(false);
    }
  };


  const removeFromWishlist = async (propertyId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/wishlist/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Remove the item from the local state
        setWishlistItems(prevItems => prevItems.filter(item => {
          // Handle both property object and property reference cases
          if (item._id === propertyId) return false;
          if (item.propertyId && (item.propertyId._id === propertyId || item.propertyId === propertyId)) return false;
          return true;
        }));
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to remove from wishlist');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      setError('Failed to connect to server');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

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
          <div className="wishlist-header">
            <h1>My Wishlist</h1>
            <p>Properties you've saved for later</p>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={fetchWishlist} className="retry-btn">Retry</button>
            </div>
          )}

          {loading ? (
            <div className="loading-skeleton">
              <div className="skeleton-card"></div>
              <div className="skeleton-card"></div>
              <div className="skeleton-card"></div>
            </div>
          ) : wishlistItems.length === 0 ? (
            <div className="empty-wishlist">
              <div className="empty-icon">💔</div>
              <h3>Your wishlist is empty</h3>
              <p>Save properties you like to view them later</p>
              <Link to={user?.role === 'buyer' ? '/buyer/dashboard' : '/renter/dashboard'} className="browse-properties-btn">
                Browse Properties
              </Link>
            </div>
          ) : (
            <div className="wishlist-grid">
              {wishlistItems.map((item, index) => {
                // Check if item is a property object or a reference
                const property = item.propertyId || item;
                
                // Skip rendering if property is not valid
                if (!property || typeof property !== 'object') {
                  console.error('Invalid property data:', item);
                  return null;
                }
                
                return (
                <div key={property._id || `wishlist-item-${index}`} className="wishlist-card">
                  <div className="wishlist-card-image">
                    <img 
                      src={(() => {
                        // Handle case when property.images is undefined or empty
                        if (!property.images || !Array.isArray(property.images) || property.images.length === 0) {
                          return '/placeholder-property.jpg';
                        }
                        
                        const image = property.images[0];
                        
                        // Handle string image paths
                        if (typeof image === 'string') {
                          return image.startsWith('http') ? image : `http://localhost:5002${image}`;
                        }
                        
                        // Handle object image with url property
                        if (image && image.url) {
                          return image.url.startsWith('http') ? image.url : `http://localhost:5002${image.url}`;
                        }
                        
                        // Fallback to placeholder
                        return '/placeholder-property.jpg';
                      })()} 
                      alt={property.title || 'Property'} 
                      onError={(e) => { e.target.src = '/placeholder-property.jpg'; }}
                    />
                    <button 
                      className="remove-wishlist-btn" 
                      onClick={() => removeFromWishlist(property._id)}
                      title="Remove from wishlist"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <div className="wishlist-card-content">
                    <h3>{property.title}</h3>
                    <p className="price">${typeof property.price === 'number' ? property.price.toLocaleString() : '0'}</p>
                    <p className="location">
                      {property.location?.address?.city || ''}
                      {property.location?.address?.city && property.location?.address?.state ? ', ' : ''}
                      {property.location?.address?.state || ''}
                      {!property.location?.address?.city && !property.location?.address?.state ? 'Location not specified' : ''}
                    </p>
                    <div className="property-details">
                      <span>{property.details?.bedrooms || 0} beds</span>
                      <span>{property.details?.bathrooms || 0} baths</span>
                      <span>{property.details?.area?.size || 0} {property.details?.area?.unit || 'sqft'}</span>
                    </div>
                    <Link 
                      to={`/${user.role === 'buyer' ? 'buyer' : 'renter'}/property/${property._id}`} 
                      className="view-property-btn"
                    >
                      View Property
                    </Link>
                  </div>
                </div>
              )})}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Wishlist;