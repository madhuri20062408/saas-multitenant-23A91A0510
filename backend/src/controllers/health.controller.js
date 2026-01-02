const { query } = require('../utils/db');

const healthCheck = async (req, res) => {
  try {
    // Simple query to verify DB connection
    await query('SELECT 1');

    return res.status(200).json({
      success: true,
      status: 'ok',
      checks: {
        database: 'up'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);

    return res.status(500).json({
      success: false,
      status: 'error',
      checks: {
        database: 'down'
      },
      message: 'Health check failed'
    });
  }
};

module.exports = {
  healthCheck,
};
