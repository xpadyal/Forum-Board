BigInt.prototype.toJSON = function () {
    return this.toString();
  };

import express from 'express';
import { config ,supabase,supabaseConfig} from './config.js';
import userRoutes from './src/routes/user.routes.js';

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());

// Test route to verify Supabase connection
app.get('/api/health', async (req, res) => {
  try {
    // Test Supabase connection by making a simple query
    const { data, error } = await supabase.from('_prisma_migrations').select('id').limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist" which is fine for testing
      throw error;
    }
    
    res.json({ 
      status: 'ok', 
      message: 'Server and Supabase are connected',
      supabase: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Supabase connection failed',
      error: error.message 
    });
  }
});

// Example route - you can add your forum routes here
app.get('/api/test', (req, res) => {
  res.json({ message: 'Forum Board API is running!' });
});

app.use('/api/users', userRoutes);

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Server running on http://localhost:${config.port}`);
  console.log(`📊 Supabase connected to: ${supabaseConfig.url}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
});

// Export app and supabase for use in other files
export { app, supabase };

