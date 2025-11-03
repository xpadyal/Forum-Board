import jwt from 'jsonwebtoken';
import { jwtSecret } from '../../config.js';

/**
 * Authentication middleware to verify JWT token
 * Attaches user info to req.user if token is valid
 */
export const authenticate = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'No authorization header provided' });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    if (!jwtSecret) {
      return res.status(500).json({ message: 'JWT_SECRET not configured' });
    }

    // Verify and decode token
    const decoded = jwt.verify(token, jwtSecret);
    
    // Attach user info to request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Authentication failed', error: error.message });
  }
};

