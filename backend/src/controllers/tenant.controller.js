// controllers/tenant.controller.js
const { query } = require('../utils/db');

// Helper: check if user can access tenant
const ensureTenantAccess = (user, tenantId) => {
  if (user.role === 'SUPER_ADMIN') return true;
  return user.tenantId === Number(tenantId);
};

// API 5: Get Tenant Details
// GET /api/tenants/:id
exports.getTenantDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (!ensureTenantAccess(currentUser, id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to tenant',
      });
    }

    const tenantRes = await query(
      `SELECT 
         t.id,
         t.name,
         t.subdomain,
         t.created_at AS "createdAt",
         t.updated_at AS "updatedAt",
         p.name AS "planName",
         p.max_users AS "maxUsers",
         p.max_projects AS "maxProjects"
       FROM tenants t
       JOIN plans p ON p.id = t.plan_id
       WHERE t.id = $1`,
      [id]
    );

    if (tenantRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    const statsRes = await query(
      `SELECT 
         (SELECT COUNT(*)::int FROM users WHERE tenant_id = $1) AS "totalUsers",
         (SELECT COUNT(*)::int FROM projects WHERE tenant_id = $1) AS "totalProjects",
         (SELECT COUNT(*)::int FROM tasks WHERE tenant_id = $1) AS "totalTasks"`,
      [id]
    );

    return res.json({
      success: true,
      data: {
        ...tenantRes.rows[0],
        stats: statsRes.rows[0],
      },
    });
  } catch (err) {
    console.error('getTenantDetails error', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

// API 6: Update Tenant
// PUT /api/tenants/:id
exports.updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const { name, planId } = req.body; // name always allowed; plan change superadmin only

    if (!ensureTenantAccess(currentUser, id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to tenant',
      });
    }

    // Tenant admin can only update name
    let newPlanId = null;
    if (planId) {
      if (currentUser.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Only super admin can update plan',
        });
      }
      newPlanId = planId;
    }

    const tenantRes = await query(
      `SELECT id FROM tenants WHERE id = $1`,
      [id]
    );

    if (tenantRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    const updateRes = await query(
      `UPDATE tenants
       SET
         name = COALESCE($1, name),
         plan_id = COALESCE($2, plan_id),
         updated_at = NOW()
       WHERE id = $3
       RETURNING
         id,
         name,
         subdomain,
         plan_id AS "planId",
         created_at AS "createdAt",
         updated_at AS "updatedAt"`,
      [name || null, newPlanId, id]
    );

    return res.json({
      success: true,
      message: 'Tenant updated successfully',
      data: updateRes.rows[0],
    });
  } catch (err) {
    console.error('updateTenant error', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

// API 7: List All Tenants (SUPER_ADMIN)
// GET /api/tenants
exports.listTenants = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const countRes = await query(
      `SELECT COUNT(*)::int AS count FROM tenants`
    );
    const totalTenants = countRes.rows[0].count;

    const tenantsRes = await query(
      `SELECT 
         t.id,
         t.name,
         t.subdomain,
         t.created_at AS "createdAt",
         p.name AS "planName",
         p.max_users AS "maxUsers",
         p.max_projects AS "maxProjects"
       FROM tenants t
       JOIN plans p ON p.id = t.plan_id
       ORDER BY t.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // stats for each tenant (simple version; not super optimized but OK for assignment)
    const tenants = [];
    for (const t of tenantsRes.rows) {
      const statsRes = await query(
        `SELECT 
           (SELECT COUNT(*)::int FROM users WHERE tenant_id = $1) AS "totalUsers",
           (SELECT COUNT(*)::int FROM projects WHERE tenant_id = $1) AS "totalProjects"
         `,
        [t.id]
      );
      tenants.push({
        ...t,
        stats: statsRes.rows[0],
      });
    }

    return res.json({
      success: true,
      data: {
        tenants,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalTenants / Number(limit)) || 1,
          totalTenants,
          limit: Number(limit),
        },
      },
    });
  } catch (err) {
    console.error('listTenants error', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};
