require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { query } = require('./utils/db');  // ADD THIS LINE

const authRoutes = require('./routes/auth.routes');
const tenantRoutes = require('./routes/tenant.routes');
const userRoutes = require('./routes/user.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await query('SELECT 1');  // CHANGED THIS LINE

    res.status(200).json({
      success: true,
      status: 'ok',
      checks: {
        database: 'up'
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'error',
      checks: {
        database: 'down'
      }
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', taskRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
