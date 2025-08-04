// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error response
  let error = {
    success: false,
    message: 'Internal server error',
    statusCode: 500
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map(val => val.message);
    error = {
      success: false,
      message: 'Validation failed',
      errors: validationErrors,
      statusCode: 400
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = {
      success: false,
      message: `${field} already exists`,
      statusCode: 409
    };
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    error = {
      success: false,
      message: 'Invalid ID format',
      statusCode: 400
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      success: false,
      message: 'Invalid token',
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      success: false,
      message: 'Token has expired',
      statusCode: 401
    };
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      success: false,
      message: 'File size too large',
      statusCode: 400
    };
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    error = {
      success: false,
      message: 'Too many files uploaded',
      statusCode: 400
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      success: false,
      message: 'Unexpected file field',
      statusCode: 400
    };
  }

  // Custom application errors
  if (err.isOperational) {
    error = {
      success: false,
      message: err.message,
      statusCode: err.statusCode || 500
    };
  }

  // Development error details
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
    error.details = err.message;
  }

  res.status(error.statusCode).json(error);
};

// 404 handler for undefined routes
export const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Custom error class
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation error handler
export const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(val => val.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Duplicate key error handler
export const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const message = `${field} already exists. Please use a different ${field}.`;
  return new AppError(message, 409);
};

// Cast error handler
export const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// JWT error handlers
export const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again.', 401);
};

export const handleJWTExpiredError = () => {
  return new AppError('Your token has expired. Please log in again.', 401);
};

// Rate limit error handler
export const handleRateLimitError = () => {
  return new AppError('Too many requests from this IP. Please try again later.', 429);
}; 