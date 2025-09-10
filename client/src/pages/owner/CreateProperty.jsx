import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUpload, FaTimes } from 'react-icons/fa';
import './CreateProperty.css';

const CreateProperty = () => {
  const navigate = useNavigate();
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

  const propertyTypes = [
    'apartment', 'house', 'condo', 'townhouse', 'villa', 'land', 'commercial'
  ];

  const amenitiesList = [
    'air_conditioning', 'heating', 'balcony', 'garden', 'pool', 'gym',
    'elevator', 'security', 'furnished', 'pet_friendly', 'utilities_included'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
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

    // Set the single image
    setImages([file]);

    // Create and set preview URL for the image
    setPreviewImages([URL.createObjectURL(file)]);
  };

  const removeImage = () => {
    setImages([]);
    setPreviewImages([]);
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 3) { // Final step validation
      if (!formData.description || formData.description.length < 50) {
        newErrors.description = 'Description must be at least 50 characters';
      }
      if (images.length < 1) {
        newErrors.images = 'Please upload at least 1 image';
      }
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
    
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Step 1: Upload image first
      const imageFormData = new FormData();
      images.forEach((image, index) => {
        imageFormData.append(`images`, image);
      });

      const uploadResponse = await fetch('/api/owner/upload-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: imageFormData
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.message || 'Failed to upload image');
      }

      // Step 2: Create property with uploaded image URL
      const propertyData = {
        title: formData.title,
        description: formData.description,
        propertyType: formData.propertyType,
        listingType: formData.listingType,
        price: formData.price,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        squareFootage: formData.squareFootage,
        amenities: formData.amenities, // Send as array directly
        images: uploadData.data.images.map(img => img.url) // Extract just the URLs
      };

      const propertyResponse = await fetch('/api/owner/properties', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(propertyData)
      });

      const propertyResult = await propertyResponse.json();

      if (!propertyResponse.ok) {
        throw new Error(propertyResult.message || 'Failed to create property');
      }

      alert('Property created successfully!');
      navigate('/owner/dashboard');
      
    } catch (error) {
      console.error('Error creating property:', error);
      setErrors(prev => ({
        ...prev,
        submit: error.message || 'Failed to create property. Please try again.'
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
        <label>Property Image *</label>
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
            <span>Click to upload image</span>
          </label>
        </div>
        
        {errors.images && <span className="error-text">{errors.images}</span>}
        
        {previewImages.length > 0 && (
          <div className="image-previews">
            {previewImages.map((preview, index) => (
              <div key={index} className="image-preview">
                <img src={preview} alt={`Preview ${index + 1}`} />
                <button
                  type="button"
                  className="remove-image"
                  onClick={() => removeImage()}
                >
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="create-property">
      <div className="property-form-container">
        <div className="form-header">
          <h2>Create New Property</h2>
          <p>Step {currentStep} of 3 - Fill in the details below</p>
        </div>
        
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(currentStep / 3) * 100}%` }}></div>
        </div>

        <form onSubmit={handleSubmit}>
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
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Creating Property...' : 'Create Property'}
              </button>
            )}
          </div>

          {errors.submit && (
            <div className="error-message">{errors.submit}</div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateProperty;