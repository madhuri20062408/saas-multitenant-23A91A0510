const express = require('express');
const router = express.Router();

const { authenticate, requireRole } = require('../middleware/auth');
const projectController = require('../controllers/project.controller');

// List projects: any logged-in user in the tenant
router.get('/', authenticate, projectController.listProjects);

// Create project: only TENANT_ADMIN
router.post(
  '/',
  authenticate,
  requireRole(['TENANT_ADMIN']),
  projectController.createProject
);

// Get single project by id
router.get('/:id', authenticate, projectController.getProjectById);

// Update project: only TENANT_ADMIN
router.put(
  '/:id',
  authenticate,
  requireRole(['TENANT_ADMIN']),
  projectController.updateProject
);

// Delete project: only TENANT_ADMIN
router.delete(
  '/:id',
  authenticate,
  requireRole(['TENANT_ADMIN']),
  projectController.deleteProject
);

module.exports = router;
