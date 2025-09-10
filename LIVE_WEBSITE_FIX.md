# Live Website Fix Instructions

## Issues Fixed

✅ **Rate Limiting Error**: Removed the `authRateLimit` middleware from login and registration routes
✅ **Authentication Flow**: Fixed token handling and API connections
✅ **Local Development**: Both frontend and backend servers are running locally without issues

## Current Status

- **Local Backend**: Running on `http://localhost:5002` ✅
- **Local Frontend**: Running on `http://localhost:5173` ✅
- **Live Backend**: Still has the old code with rate limiting ❌
- **Live Frontend**: Configured to use `https://dwelo.onrender.com` ❌

## To Fix the Live Website

### Step 1: Deploy Updated Backend to Render

1. **Access your Render dashboard** at https://render.com
2. **Find your backend service** (likely named "dwelo" or similar)
3. **Trigger a manual deploy** or **push the updated code** to your connected repository
4. **Key files that were updated**:
   - `server/routes/authRoutes.js` - Removed rate limiting from login/register
   - `server/middleware/authMiddleware.js` - Contains the rate limiting code (now unused)

### Step 2: Verify Backend Deployment

1. **Check the backend URL**: https://dwelo.onrender.com/api/health
2. **Test login endpoint**: https://dwelo.onrender.com/api/auth/login
3. **Ensure no rate limiting errors** appear

### Step 3: Frontend Configuration

The frontend is already configured correctly:
- Production API URL: `https://dwelo.onrender.com`
- Environment file: `client/.env.production`

### Step 4: Test the Live Website

1. **Visit**: https://dwelo-home-rent-and-sale-website.onrender.com
2. **Test login** with valid credentials
3. **Verify** no "Too many authentication attempts" error
4. **Test** property details, user profiles, and other features

## Alternative: Quick Fix for Testing

If you want to test immediately with the local backend:

1. **Update** `client/.env.production`:
   ```
   VITE_API_URL=http://localhost:5002
   ```

2. **Rebuild** the frontend:
   ```bash
   cd client
   npm run build
   ```

3. **Deploy** the new build to your frontend hosting service

**Note**: This is only for testing. For production, use HTTPS backend URL.

## Files Modified

- ✅ `server/routes/authRoutes.js` - Removed authRateLimit middleware
- ✅ `server/middleware/authMiddleware.js` - Rate limiting code still exists but unused

## Next Steps

1. **Deploy the updated backend** to Render
2. **Test the live website** thoroughly
3. **Monitor** for any other issues
4. **Consider** removing the unused rate limiting code entirely if not needed

## Contact

If you need help with the Render deployment process, check:
- Render documentation: https://render.com/docs
- Your Render dashboard for deployment logs
- Ensure your repository is connected and auto-deploy is enabled