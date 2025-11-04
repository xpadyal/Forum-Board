BigInt.prototype.toJSON = function () {
    return this.toString();
  };

import express from 'express';
import cors from 'cors';
import { config ,supabase,supabaseConfig} from './config.js';
import userRoutes from './src/routes/user.routes.js';
import threadRoutes from './src/routes/thread.routes.js';
import commentRoutes from './src/routes/comment.routes.js';
import { healthCheck } from './src/controllers/health.controller.js';
import errorHandler from './src/middleware/error.middleware.js';
import { AppError } from './src/utils/appError.js';
import uploadRoutes from './src/routes/upload.routes.js';

// Initialize Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.get('/api/health', healthCheck);
app.use('/api/users', userRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/uploads', uploadRoutes);
app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Server running on http://localhost:${config.port}`);
  console.log(`📊 Supabase connected to: ${supabaseConfig.url}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
});

// Export app and supabase for use in other files
export {app};

