import { AppError } from '../utils/appError.js';

export default (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error for debugging
  console.error('Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack:', err.stack);
  }

  // AppError instances (operational errors)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Custom known errors (like validation or missing params)
  if (err.name === 'ValidationError' || err.message.includes('must belong')) {
    return res.status(400).json({
      status: 'error',
      message: err.message,
    });
  }

  // Prisma errors
  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({
      status: 'error',
      message: 'Database error',
      details: err.meta || err.message,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token expired',
    });
  }

  // Default - send generic error in production
  res.status(err.statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
