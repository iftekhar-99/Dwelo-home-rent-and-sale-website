import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaUpload, FaTimes, FaArrowLeft } from 'react-icons/fa';
import { fetchWithAuth } from '../../utils/api';
import './CreateProperty.css'; // Reuse the same CSS

const EditProperty = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: '',
    listingType: '',
    price: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    bedrooms: '',
    bathrooms: '',
    squareFootage: '',
    amenities: []
  });
  
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [originalImages, setOriginalImages] = useState([]);

  const propertyTypes = [
    'apartment', 'house', 'condo', 'townhouse', 'villa', 'land', 'commercial'
  ];

  const amenitiesList = [
    'air_conditioning', 'heating', 'balcony', 'garden', 'pool', 'gym',
    'elevator', 'security', 'furnished', 'pet_friendly', 'utilities_included'
  ];

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

  const fetchPropertyDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetchWithAuth(`/api/properties/${id}`);

      const data = await response.json();

      if (response.ok && data.success) {
       const property = data.data.property;
        
        // Set original images for reference
        if (property.images && Array.isArray(property.images)) {
          setOriginalImages(property.images.map(img => {
            if (typeof img === 'string') {
              return img.startsWith('/') ? img : `/${img}`;
            }
            return img.url || img;
          }));
        }

        // Populate form data
         setFormData({
          title: property.title || '',
          description: property.description || '',
          propertyType: property.propertyType || '',
          listingType: property.listingType || '',
           price: String(property.price ?? ''),
          address: property.location?.address?.street || '',
          city: property.location?.address?.city || '',
          state: property.location?.address?.state || '',
          zipCode: property.location?.address?.zipCode || '',
          bedrooms: property.details?.bedrooms || '',
          bathrooms: property.details?.bathrooms || '',
          squareFootage: property.details?.area?.size || '',
          amenities: property.amenities || []
        });

        // Set preview images if available
        if (property.images && property.images.length > 0) {
          const imageUrls = property.images.map(img => {
            if (typeof img === 'string') {
              return img.startsWith('http') ? img : `http://localhost:5002${img}`;
            }
            return img.url ? (img.url.startsWith('http') ? img.url : `http://localhost:5002${img.url}`) : '';
          });
          setPreviewImages(imageUrls);
        }
      } else {
        setErrors({ submit: data.message || 'Failed to fetch property details' });
      }
    } catch (error) {
      console.error('Error fetching property details:', error);
      setErrors({ submit: 'Failed to fetch property details' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAmenityChange = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Only use the first file (single image upload)
    const file = files[0];

    // Validate file
    const isValidType = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
    const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
    
    if (!isValidType || !isValidSize) {
      setErrors(prev => ({
        ...prev,
        images: 'Invalid file. Only JPG/PNG files under 5MB are allowed.'
      }));
      return;
    }

    // Set the single image (only local preview; no backend update yet)
    setImages([file]);
    setPreviewImages([URL.createObjectURL(file)]);
  };

  const removeImage = () => {
    setImages([]);
    setPreviewImages([]);
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.title) newErrors.title = 'Title is required';
      if (!formData.propertyType) newErrors.propertyType = 'Property type is required';
      if (!formData.listingType) newErrors.listingType = 'Listing type is required';
      if (!formData.price) newErrors.price = 'Price is required';
    } else if (step === 2) {
      if (!formData.address) newErrors.address = 'Address is required';
      if (!formData.city) newErrors.city = 'City is required';
      if (!formData.state) newErrors.state = 'State is required';
      if (!formData.zipCode) newErrors.zipCode = 'ZIP code is required';
    } else if (step === 3) {
      if (!formData.description || formData.description.length < 50) {
        newErrors.description = 'Description must be at least 50 characters';
      }
      // Don't require new image upload for edit
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      // First, upload any new images if they exist
      let imageUrls = originalImages; // Default to original images
      
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach(image => {
          formData.append('images', image);
        });
        
        const uploadResponse = await fetchWithAuth('/api/upload', {
          method: 'POST',
          body: formData,
          headers: {}
        });
        
        const uploadData = await uploadResponse.json();
        
        if (!uploadResponse.ok) {
          throw new Error(uploadData.message || 'Failed to upload images');
        }
        
        // Replace with new image URLs
        imageUrls = uploadData.data.images.map(img => img.url);
      }
      
      // Then, update the property with all data including image URLs
      const propertyData = {
        title: formData.title,
        description: formData.description,
        propertyType: formData.propertyType,
        listingType: formData.listingType,
        price: Number(formData.price),
        location: {
          address: {
            street: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: 'USA' // Default to USA
          }
        },
        details: {
          bedrooms: parseInt(formData.bedrooms) || 0,
          bathrooms: parseInt(formData.bathrooms) || 0,
          area: {
            size: parseInt(formData.squareFootage) || 0,
            unit: 'sqft'
          }
        },
        amenities: formData.amenities,
        images: imageUrls
      };

      const updateUrl = `/api/owner/properties/${id}`;
      console.log('[EditProperty] Submitting update to', updateUrl, 'payload:', propertyData);
      const propertyResponse = await fetchWithAuth(updateUrl, {
        method: 'PUT',
        headers: {
          'X-Update-Intent': 'owner-edit-submit'
        },
        body: JSON.stringify(propertyData)
      });

      // Read raw response for robust diagnostics
      const status = propertyResponse.status;
      const rawText = await propertyResponse.text();
      let propertyResult = null;
      try { propertyResult = JSON.parse(rawText); } catch (e) { /* non-JSON */ }
      console.log('[EditProperty] Update response', status, propertyResult || rawText);

      if (!propertyResponse.ok || !(propertyResult && propertyResult.success)) {
        const msg = propertyResult?.message || `Update failed (status ${status})`;
        throw new Error(msg);
      }
      alert('Property updated successfully');
      navigate(`/owner/property/${id}`);
      
    } catch (error) {
      console.error('Error updating property:', error);
      setErrors(prev => ({
        ...prev,
        submit: error.message || 'Failed to update property. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="form-step">
      <h3>Basic Information</h3>
      
      <div className="form-group">
        <label>Property Title *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Enter property title"
          className={errors.title ? 'error' : ''}
        />
        {errors.title && <span className="error-text">{errors.title}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Property Type *</label>
          <select
            name="propertyType"
            value={formData.propertyType}
            onChange={handleInputChange}
            className={errors.propertyType ? 'error' : ''}
          >
            <option value="">Select property type</option>
            {propertyTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          {errors.propertyType && <span className="error-text">{errors.propertyType}</span>}
        </div>

        <div className="form-group">
          <label>Listing Type *</label>
          <select
            name="listingType"
            value={formData.listingType}
            onChange={handleInputChange}
            className={errors.listingType ? 'error' : ''}
          >
            <option value="">Select listing type</option>
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
          {errors.listingType && <span className="error-text">{errors.listingType}</span>}
        </div>
      </div>

      <div className="form-group">
        <label>Price *</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleInputChange}
          placeholder="Enter price"
          className={errors.price ? 'error' : ''}
        />
        {errors.price && <span className="error-text">{errors.price}</span>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="form-step">
      <h3>Location & Details</h3>
      
      <div className="form-group">
        <label>Street Address *</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          placeholder="Enter street address"
          className={errors.address ? 'error' : ''}
        />
        {errors.address && <span className="error-text">{errors.address}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>City *</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            placeholder="Enter city"
            className={errors.city ? 'error' : ''}
          />
          {errors.city && <span className="error-text">{errors.city}</span>}
        </div>

        <div className="form-group">
          <label>State *</label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            placeholder="Enter state"
            className={errors.state ? 'error' : ''}
          />
          {errors.state && <span className="error-text">{errors.state}</span>}
        </div>

        <div className="form-group">
          <label>ZIP Code *</label>
          <input
            type="text"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleInputChange}
            placeholder="Enter ZIP code"
            className={errors.zipCode ? 'error' : ''}
          />
          {errors.zipCode && <span className="error-text">{errors.zipCode}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Bedrooms</label>
          <input
            type="number"
            name="bedrooms"
            value={formData.bedrooms}
            onChange={handleInputChange}
            placeholder="Number of bedrooms"
            min="0"
          />
        </div>

        <div className="form-group">
          <label>Bathrooms</label>
          <input
            type="number"
            name="bathrooms"
            value={formData.bathrooms}
            onChange={handleInputChange}
            placeholder="Number of bathrooms"
            min="0"
            step="0.5"
          />
        </div>

        <div className="form-group">
          <label>Square Footage</label>
          <input
            type="number"
            name="squareFootage"
            value={formData.squareFootage}
            onChange={handleInputChange}
            placeholder="Square footage"
            min="0"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Amenities</label>
        <div className="amenities-grid">
          {amenitiesList.map(amenity => (
            <label key={amenity} className="amenity-checkbox">
              <input
                type="checkbox"
                checked={formData.amenities.includes(amenity)}
                onChange={() => handleAmenityChange(amenity)}
              />
              <span>{amenity.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="form-step">
      <h3>Description & Images</h3>
      
      <div className="form-group">
        <label>Description *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describe your property in detail..."
          rows="6"
          className={errors.description ? 'error' : ''}
        />
        {errors.description && <span className="error-text">{errors.description}</span>}
      </div>

      <div className="form-group">
        <label>Property Image</label>
        <p className="image-note">Current image will be used if no new image is uploaded</p>
        <div className="image-upload-zone">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            id="image-upload"
            style={{ display: 'none' }}
          />
          <label htmlFor="image-upload" className="upload-button">
            <FaUpload />
            <span>Click to upload new image</span>
          </label>
        </div>
        
        {errors.images && <span className="error-text">{errors.images}</span>}
        
        {previewImages.length > 0 && (
          <div className="image-previews">
            {previewImages.map((preview, index) => (
              <div key={index} className="image-preview">
                <img src={preview} alt={`Preview ${index + 1}`} />
                {images.length > 0 && (
                  <button
                    type="button"
                    className="remove-image"
                    onClick={() => removeImage()}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="create-property">
        <div className="loading-spinner"></div>
        <p>Loading property details...</p>
      </div>
    );
  }

  return (
    <div className="create-property">
      <div className="property-form-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <FaArrowLeft /> Back
        </button>
      </div>
      
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="property-form-container">
          <div className="form-header">
            <h2>Edit Property</h2>
            <p>Step {currentStep} of 3</p>
          </div>
          
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>

          {/* Render different steps based on currentStep */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Form actions */}
          <div className="form-actions">
            {currentStep > 1 && (
              <button type="button" onClick={prevStep} className="btn-secondary">
                Previous
              </button>
            )}
            {currentStep < 3 ? (
              <button type="button" onClick={nextStep} className="btn-primary">
                Next
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Updating Property...' : 'Update Property'}
              </button>
            )}
          </div>

          {errors.submit && (
            <div className="error-message">{errors.submit}</div>
          )}
        </div>
      </form>
    </div>
  );
};

export default EditProperty;