# Dwelo Server

Backend server for Dwelo home rent and sale website with user authentication.

## Setup

### 1. Environment Variables

Create a `.env` file in the server directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/DWELO

# For MongoDB Atlas (cloud):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/DWELO?retryWrites=true&w=majority

# For MongoDB with authentication:
# MONGODB_URI=mongodb://username:password@localhost:27017/DWELO?authSource=admin
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/test` - Test endpoint
- `GET /api/health` - Health check

## Project Structure

```
server/
├── config/
│   └── database.js      # MongoDB connection
├── controllers/
│   └── authController.js # Authentication logic
├── models/
│   └── User.js          # User schema
├── routes/
│   └── authRoutes.js    # Authentication routes
├── index.js             # Main server file
├── package.json
└── .env                 # Environment variables
```

## Database

The application uses MongoDB with the following collections:
- `users` - User accounts with email and hashed passwords 