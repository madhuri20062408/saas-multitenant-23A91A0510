// routes/user.routes.js
const express = require('express');
const router = express.Router();

const { authenticate, requireRole } = require('../middleware/auth');
const userController = require('../controllers/user.controller');

// Add user to tenant (API 8)
// POST /api/tenants/:tenantId/users
router.post(
  '/tenants/:tenantId/users',
  authenticate,
  requireRole(['TENANT_ADMIN']),
  userController.addUserToTenant
);

// List tenant users (API 9)
// GET /api/tenants/:tenantId/users
router.get(
  '/tenants/:tenantId/users',
  authenticate,
  userController.listTenantUsers
);

// Update user (API 10)
// PUT /api/users/:id
router.put(
  '/users/:id',
  authenticate,
  userController.updateUser
);

// Delete user (API 11)
// DELETE /api/users/:id
router.delete(
  '/users/:id',
  authenticate,
  requireRole(['TENANT_ADMIN']),
  userController.deleteUser
);

module.exports = router;
