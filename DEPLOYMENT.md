# Dwelo Deployment Guide

## Pre-deployment Configuration

### 1. Update Environment Variables

Before deploying, update the following URLs in the configuration files:

#### Server (.env file)
```
FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGIN=https://your-frontend-domain.com
```

#### Client (.env.production file)
```
VITE_API_URL=https://your-backend-domain.com
```

#### Client (vite.config.js)
Update the `__API_URL__` production value:
```javascript
__API_URL__: isDevelopment 
  ? JSON.stringify('http://localhost:5002')
  : JSON.stringify('https://your-backend-domain.com')
```

### 2. Replace Placeholder URLs

Replace the following placeholder URLs with your actual deployment URLs:
- `https://your-frontend-domain.com` - Your frontend deployment URL (e.g., Vercel, Netlify)
- `https://your-backend-domain.com` - Your backend deployment URL (e.g., Heroku, Railway, DigitalOcean)

## Deployment Steps

### Backend Deployment
1. Deploy the `server` folder to your backend hosting service
2. Ensure environment variables are set in your hosting platform
3. The server will start with `npm start` (production) or `npm run dev` (development)

### Frontend Deployment
1. Build the client: `npm run build` in the `client` folder
2. Deploy the `dist` folder to your frontend hosting service
3. Ensure the hosting service supports SPA routing (for React Router)

## Environment Variables Summary

### Server Environment Variables
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `ADMIN_EMAIL` - Admin login email
- `ADMIN_PASSWORD` - Admin login password
- `PORT` - Server port (default: 5002)
- `NODE_ENV` - Environment (production/development)
- `FRONTEND_URL` - Frontend URL for CORS
- `CORS_ORIGIN` - Allowed CORS origin

### Client Environment Variables
- `VITE_API_URL` - Backend API URL
- `VITE_APP_ENV` - Application environment

## Notes
- The application uses relative API paths (`/api/*`) which work with the Vite proxy in development
- In production, ensure your frontend and backend are properly configured for cross-origin requests
- Make sure to test all authentication flows after deployment
- Verify file upload functionality works with your hosting provider