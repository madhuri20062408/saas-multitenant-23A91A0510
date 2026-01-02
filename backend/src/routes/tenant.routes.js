// routes/tenant.routes.js
const express = require('express');
const router = express.Router();

const { authenticate, requireRole } = require('../middleware/auth');
const tenantController = require('../controllers/tenant.controller');

// Get tenant details (API 5)
// GET /api/tenants/:id
router.get(
  '/:id',
  authenticate,
  tenantController.getTenantDetails
);

// Update tenant (API 6)
// PUT /api/tenants/:id
router.put(
  '/:id',
  authenticate,
  tenantController.updateTenant
);

// List all tenants (API 7) - SUPER_ADMIN only
// GET /api/tenants
router.get(
  '/',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  tenantController.listTenants
);

module.exports = router;
