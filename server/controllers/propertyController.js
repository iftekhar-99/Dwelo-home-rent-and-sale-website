import Owner from '../models/Owner.js';
import Property from '../models/Property.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'property-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, JPG and PNG allowed.'));
    }
  }
}).array('images', 10);

export const createProperty = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      } else if (err) {
        return res.status(500).json({
          success: false,
          message: 'File upload failed'
        });
      }

      const images = req.files ? req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        caption: '',
        isPrimary: false
      })) : [];

      if (images.length > 0) {
        images[0].isPrimary = true;
      }

      const { title, description, propertyType, listingType, price, address, city, state, zipCode, bedrooms, bathrooms, squareFootage, amenities } = req.body;
      const ownerId = req.owner.ownerId; // Assuming ownerId is available from auth middleware

      const newProperty = new Property({
        ownerId,
        title,
        description,
        propertyType,
        listingType,
        price,
        location: {
          address: {
            street: address,
            city,
            state,
            zipCode,
            country: 'USA' // Assuming USA for now, can be dynamic
          }
        },
        details: {
          bedrooms,
          bathrooms,
          area: {
            size: squareFootage,
            unit: 'sqft'
          }
        },
        amenities: amenities ? JSON.parse(amenities) : [], // Amenities come as stringified array
        images,
        status: 'pending_admin_approval' // Default status
      });

      const savedProperty = await newProperty.save();

      res.status(201).json({
        success: true,
        message: 'Property created successfully and pending admin approval',
        data: { property: savedProperty }
      });
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create property'
    });
  }
};

// Get all properties with filtering capabilities
export const getAllProperties = async (req, res) => {
  try {
    const {
      listingType,
      minPrice,
      maxPrice,
      minBedrooms,
      maxBedrooms,
      city,
      state,
      zipCode,
      minYearBuilt,
      maxYearBuilt,
      amenities
    } = req.query;

    // Base query - only approved properties
    const query = { status: 'approved' };

    // Apply filters if provided
    if (listingType) {
      query.listingType = listingType;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (minBedrooms || maxBedrooms) {
      query['details.bedrooms'] = {};
      if (minBedrooms) query['details.bedrooms'].$gte = Number(minBedrooms);
      if (maxBedrooms) query['details.bedrooms'].$lte = Number(maxBedrooms);
    }

    if (city) {
      query['location.address.city'] = { $regex: city, $options: 'i' };
    }

    if (state) {
      query['location.address.state'] = { $regex: state, $options: 'i' };
    }

    if (zipCode) {
      query['location.address.zipCode'] = zipCode;
    }

    if (minYearBuilt || maxYearBuilt) {
      query['details.yearBuilt'] = {};
      if (minYearBuilt) query['details.yearBuilt'].$gte = Number(minYearBuilt);
      if (maxYearBuilt) query['details.yearBuilt'].$lte = Number(maxYearBuilt);
    }

    // Handle amenities filter (expects comma-separated string)
    if (amenities) {
      const amenitiesList = amenities.split(',');
      query.amenities = { $all: amenitiesList };
    }

    const properties = await Property.find(query)
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties',
      error: error.message
    });
  }
};

// Get property by ID
export const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('ownerId', 'name email phone');

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.json({
      success: true,
      data: { property }
    });
  } catch (error) {
    console.error('Get property by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property'
    });
  }
};

// Update property
export const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Update property fields
    Object.assign(property, req.body);
    await property.save();

    res.json({
      success: true,
      message: 'Property updated successfully',
      data: { property }
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update property'
    });
  }
};

// Delete property
export const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    await Property.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete property'
    });
  }
};