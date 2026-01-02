// routes/task.routes.js
const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const taskController = require('../controllers/task.controller');

// Create task for a project
// POST /api/projects/:projectId/tasks
router.post(
  '/projects/:projectId/tasks',
  authenticate,
  taskController.createTask
);

// List tasks for a project
// GET /api/projects/:projectId/tasks
router.get(
  '/projects/:projectId/tasks',
  authenticate,
  taskController.listProjectTasks
);

// Update task status
// PATCH /api/tasks/:taskId/status
router.patch(
  '/tasks/:taskId/status',
  authenticate,
  taskController.updateTaskStatus
);

// Update full task
// PUT /api/tasks/:taskId
router.put(
  '/tasks/:taskId',
  authenticate,
  taskController.updateTask
);

// Delete task
// DELETE /api/tasks/:taskId
router.delete(
  '/tasks/:taskId',
  authenticate,
  taskController.deleteTask
);

module.exports = router;
