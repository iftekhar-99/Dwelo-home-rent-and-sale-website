# Dwelo Backend API

A comprehensive real estate platform backend built with Node.js, Express, MongoDB, and JWT authentication.

## 🏗️ Architecture Overview

### Collection Structure

The application uses a multi-collection MongoDB architecture with role-based user management:

- **users** - Core authentication data (email, password, role, etc.)
- **buyers** - Buyer-specific fields (preferences, saved properties, etc.)
- **renters** - Renter-specific fields (rental history, employment info, etc.)
- **owners** - Owner-specific fields (verification status, properties, etc.)
- **admins** - Admin-specific fields (permissions, activity logs, etc.)

All collections are auto-created on first document insertion and appear immediately in MongoDB Compass.

### Database Indexes

Optimized indexes for query performance:
- Email uniqueness index
- Role-based queries
- Location-based searches
- Timestamp-based sorting
- Status-based filtering

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd Dwelo/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the server directory:
   ```env
   NODE_ENV=development
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/dwelo
   JWT_SECRET=your-super-secret-jwt-key-here
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

## 📊 MongoDB Compass Integration

The application is designed to work seamlessly with MongoDB Compass:

- Collections appear automatically on first document insertion
- Proper indexing for optimal query performance
- Clear document structure for easy exploration
- Real-time data updates

### Collections in Compass

1. **users** - User authentication and basic info
2. **buyers** - Buyer profiles and preferences
3. **renters** - Renter profiles and rental history
4. **owners** - Owner profiles and verification
5. **admins** - Admin profiles and permissions

## 🔐 Authentication System

### Registration

**Endpoint:** `POST /api/auth/register`

**Features:**
- Email format validation
- Password strength validation (uppercase, lowercase, number, special character)
- Role selection validation
- Duplicate email prevention
- Role-specific document creation
- JWT token generation

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "buyer",
  "phone": "+1234567890"
}
```

**File Upload (for owners):**
- Verification documents required for owner registration
- Supported formats: JPG, PNG, PDF, DOC, DOCX
- File size limit: 5MB

### Login

**Endpoint:** `POST /api/auth/login`

**Features:**
- Secure password comparison
- Account lockout after 5 failed attempts
- JWT token generation
- Role-specific data retrieval
- Last login tracking

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "buyer",
      "isEmailVerified": false,
      "lastLogin": "2024-01-01T00:00:00.000Z"
    },
    "roleData": {
      // Role-specific data
    },
    "token": "jwt_token_here"
  }
}
```

## 🔑 API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | User registration | No |
| POST | `/api/auth/login` | User login | No |
| GET | `/api/auth/profile` | Get user profile | Yes |
| PUT | `/api/auth/profile` | Update user profile | Yes |
| PUT | `/api/auth/change-password` | Change password | Yes |
| POST | `/api/auth/logout` | User logout | Yes |
| GET | `/api/auth/health` | Auth service health | No |

### Protected Routes

All protected routes require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## 🛡️ Security Features

### Password Security
- Bcrypt hashing with salt rounds of 12
- Strong password validation
- Account lockout mechanism

### JWT Security
- 7-day token expiration
- Secure token verification
- Role-based access control

### Rate Limiting
- 5 authentication attempts per 15 minutes
- IP-based rate limiting
- Automatic lockout prevention

### File Upload Security
- File type validation
- File size limits
- Secure file naming
- Upload directory isolation

## 👥 Role-Based Access Control

### User Roles

1. **buyer** - Property buyers
2. **renter** - Property renters  
3. **owner** - Property owners
4. **admin** - System administrators

### Admin Levels

1. **moderator** - Basic moderation permissions
2. **admin** - Full administrative permissions
3. **super_admin** - Complete system access

## 🗄️ Database Models

### User Model
```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  role: String (enum: ['buyer', 'renter', 'owner', 'admin']),
  name: String (required),
  phone: String (optional),
  isEmailVerified: Boolean,
  isActive: Boolean,
  lastLogin: Date,
  loginAttempts: Number,
  lockUntil: Date
}
```

### Buyer Model
```javascript
{
  userId: ObjectId (ref: User),
  preferences: {
    budget: { min: Number, max: Number },
    propertyType: [String],
    bedrooms: { min: Number, max: Number },
    bathrooms: { min: Number, max: Number },
    location: { city: String, state: String, zipCode: String },
    amenities: [String]
  },
  savedProperties: [{ propertyId: ObjectId, savedAt: Date }],
  searchHistory: [{ query: String, timestamp: Date }],
  isFirstTimeBuyer: Boolean,
  preApprovalStatus: String,
  preApprovalAmount: Number
}
```

### Renter Model
```javascript
{
  userId: ObjectId (ref: User),
  preferences: { /* similar to buyer */ },
  rentalHistory: [{
    propertyId: ObjectId,
    startDate: Date,
    endDate: Date,
    monthlyRent: Number,
    status: String
  }],
  employmentInfo: {
    employer: String,
    position: String,
    monthlyIncome: Number
  },
  references: [{ name: String, relationship: String, phone: String }],
  creditScore: Number,
  pets: { hasPets: Boolean, petTypes: [String], petCount: Number }
}
```

### Owner Model
```javascript
{
  userId: ObjectId (ref: User),
  verificationStatus: String (enum: ['pending', 'verified', 'rejected']),
  verificationDocuments: [{
    documentType: String,
    fileName: String,
    filePath: String,
    uploadedAt: Date,
    verifiedAt: Date,
    verifiedBy: ObjectId
  }],
  properties: [{ propertyId: ObjectId, addedAt: Date }],
  businessInfo: { businessName: String, businessType: String, taxId: String },
  bankInfo: { accountHolderName: String, accountNumber: String, routingNumber: String },
  paymentHistory: [{ propertyId: ObjectId, amount: Number, type: String, status: String }],
  ratings: [{ from: ObjectId, rating: Number, review: String, date: Date }],
  averageRating: Number,
  totalReviews: Number
}
```

### Admin Model
```javascript
{
  userId: ObjectId (ref: User),
  adminLevel: String (enum: ['super_admin', 'admin', 'moderator']),
  permissions: [String],
  assignedRegions: [{ city: String, state: String, country: String }],
  activityLog: [{
    action: String,
    target: String,
    targetId: ObjectId,
    details: String,
    timestamp: Date,
    ipAddress: String
  }],
  verificationActions: [{ ownerId: ObjectId, action: String, reason: String }],
  supportTickets: [{ ticketId: ObjectId, status: String, assignedAt: Date }],
  isActive: Boolean,
  lastActivity: Date
}
```

## 🛠️ Admin Management

### Creating Admins

Use the admin creation script:

```bash
# Create super admin
node scripts/createAdmin.js create-super admin@dwelo.com Password123 "Super Admin"

# Create regular admin
node scripts/createAdmin.js create moderator@dwelo.com Password123 "Moderator" moderator

# List all admins
node scripts/createAdmin.js list
```

### Admin Permissions

- **user_management** - Manage user accounts
- **property_management** - Manage properties
- **verification_management** - Verify owner documents
- **payment_management** - Manage payments
- **report_management** - Access reports
- **system_settings** - System configuration
- **analytics_view** - View analytics
- **content_moderation** - Moderate content

## 🔍 Error Handling

### Global Error Middleware

The application includes comprehensive error handling:

- **Validation Errors** - 400 Bad Request
- **Authentication Errors** - 401 Unauthorized
- **Authorization Errors** - 403 Forbidden
- **Not Found Errors** - 404 Not Found
- **Duplicate Key Errors** - 409 Conflict
- **Rate Limit Errors** - 429 Too Many Requests
- **Server Errors** - 500 Internal Server Error

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"],
  "statusCode": 400
}
```

## 📈 Performance Optimization

### Database Indexes

- Email uniqueness index
- Role-based query optimization
- Location-based search indexes
- Timestamp-based sorting
- Status-based filtering

### Query Optimization

- Lean queries for read operations
- Selective field projection
- Proper population strategies
- Index-aware queries

## 🧪 Testing

### API Testing

Use tools like Postman or curl to test endpoints:

```bash
# Test registration
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPass123!","role":"buyer"}'

# Test login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'
```

## 🚀 Deployment

### Production Setup

1. Set environment variables:
   ```env
   NODE_ENV=production
   PORT=5001
   MONGODB_URI=your_production_mongodb_uri
   JWT_SECRET=your_production_jwt_secret
   ```

2. Install production dependencies:
   ```bash
   npm install --production
   ```

3. Start the server:
   ```bash
   npm start
   ```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

## 📚 API Documentation

### Health Check

```bash
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

### API Info

```bash
GET /api
```

Response:
```json
{
  "message": "Dwelo API",
  "version": "1.0.0",
  "endpoints": {
    "auth": {
      "register": "POST /api/auth/register",
      "login": "POST /api/auth/login",
      "profile": "GET /api/auth/profile",
      "updateProfile": "PUT /api/auth/profile",
      "changePassword": "PUT /api/auth/change-password",
      "logout": "POST /api/auth/logout"
    }
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

---

**Built with ❤️ for the Dwelo real estate platform**
