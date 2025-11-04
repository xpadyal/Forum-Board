import { supabase } from '../../config.js';

/**
 * GET /api/health
 * Health check endpoint to verify Supabase connection
 */
export const healthCheck = async (req, res) => {
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
};

