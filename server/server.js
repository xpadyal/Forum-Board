BigInt.prototype.toJSON = function () {
    return this.toString();
  };

import express from 'express';
import { config ,supabase,supabaseConfig} from './config.js';
import userRoutes from './src/routes/user.routes.js';
import threadRoutes from './src/routes/thread.routes.js';
import commentRoutes from './src/routes/comment.routes.js';
import { healthCheck } from './src/controllers/health.controller.js';

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());


app.get('/api/health', healthCheck);
app.use('/api/users', userRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api/comments', commentRoutes);
// Start server
app.listen(config.port, () => {
  console.log(`🚀 Server running on http://localhost:${config.port}`);
  console.log(`📊 Supabase connected to: ${supabaseConfig.url}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
});

// Export app and supabase for use in other files
export { app, supabase };

