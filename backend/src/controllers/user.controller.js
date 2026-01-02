// controllers/user.controller.js
const bcrypt = require('bcryptjs');
const { query } = require('../utils/db');

// API 8: Add User to Tenant
// POST /api/tenants/:tenantId/users
exports.addUserToTenant = async (req, res) => {
  try {
    const currentUser = req.user;
    const { tenantId } = req.params;
    const { email, password, name, role } = req.body;

    if (currentUser.tenantId !== Number(tenantId)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot add user to a different tenant',
      });
    }

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'email, password and name are required',
      });
    }

    const newRole = role || 'USER';

    // Check plan user limit
    const planRes = await query(
      `SELECT p.max_users
       FROM tenants t
       JOIN plans p ON p.id = t.plan_id
       WHERE t.id = $1`,
      [tenantId]
    );

    if (planRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant or plan not found',
      });
    }

    const maxUsers = planRes.rows[0].max_users;

    const countRes = await query(
      `SELECT COUNT(*)::int AS count
       FROM users
       WHERE tenant_id = $1`,
      [tenantId]
    );

    if (countRes.rows[0].count >= maxUsers) {
      return res.status(403).json({
        success: false,
        message: 'User limit reached for current plan',
      });
    }

    // Check email uniqueness per tenant
    const existingUser = await query(
      `SELECT id FROM users WHERE email = $1 AND tenant_id = $2`,
      [email.toLowerCase(), tenantId]
    );

    if (existingUser.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists in this tenant',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const insertRes = await query(
      `INSERT INTO users (email, password_hash, name, role, tenant_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING
         id,
         email,
         name,
         role,
         tenant_id AS "tenantId",
         created_at AS "createdAt"`,
      [email.toLowerCase(), passwordHash, name, newRole, tenantId]
    );

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: insertRes.rows[0],
    });
  } catch (err) {
    console.error('addUserToTenant error', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

// API 9: List Tenant Users
// GET /api/tenants/:tenantId/users
exports.listTenantUsers = async (req, res) => {
  try {
    const currentUser = req.user;
    const { tenantId } = req.params;
    const { search, role, page = 1, limit = 50 } = req.query;

    if (currentUser.tenantId !== Number(tenantId) && currentUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Cannot view users of a different tenant',
      });
    }

    const offset = (Number(page) - 1) * Number(limit);
    const params = [tenantId];
    let where = 'WHERE tenant_id = $1';

    if (role) {
      params.push(role);
      where += ` AND role = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      where += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length})`;
    }

    const countRes = await query(
      `SELECT COUNT(*)::int AS count FROM users ${where}`,
      params
    );
    const total = countRes.rows[0].count;

    params.push(limit, offset);

    const listRes = await query(
      `SELECT
         id,
         email,
         name,
         role,
         tenant_id AS "tenantId",
         created_at AS "createdAt",
         updated_at AS "updatedAt"
       FROM users
       ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({
      success: true,
      data: {
        users: listRes.rows,
        total,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)) || 1,
          limit: Number(limit),
        },
      },
    });
  } catch (err) {
    console.error('listTenantUsers error', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

// API 10: Update User
// PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;
    const { name, role, isActive } = req.body;

    const userRes = await query(
      `SELECT id, tenant_id, role FROM users WHERE id = $1`,
      [id]
    );

    if (userRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const target = userRes.rows[0];

    // Users can update their own name; tenant admin can change role/isActive
    if (currentUser.id !== target.id && currentUser.role !== 'TENANT_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user',
      });
    }

    if (currentUser.role === 'TENANT_ADMIN' && currentUser.tenantId !== target.tenant_id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized for users of another tenant',
      });
    }

    const updateRes = await query(
      `UPDATE users
       SET
         name = COALESCE($1, name),
         role = COALESCE($2, role),
         updated_at = NOW()
       WHERE id = $3
       RETURNING
         id,
         email,
         name,
         role,
         tenant_id AS "tenantId",
         created_at AS "createdAt",
         updated_at AS "updatedAt"`,
      [name || null, role || null, id]
    );

    return res.json({
      success: true,
      message: 'User updated successfully',
      data: updateRes.rows[0],
    });
  } catch (err) {
    console.error('updateUser error', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

// API 11: Delete User
// DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;

    if (currentUser.userId === Number(id)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete yourself',
      });
    }

    const userRes = await query(
      `SELECT id, tenant_id FROM users WHERE id = $1`,
      [id]
    );

    if (userRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const target = userRes.rows[0];

    if (currentUser.role === 'TENANT_ADMIN' && currentUser.tenantId !== target.tenant_id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete users of another tenant',
      });
    }

    // Set assigned_to (not assignee_id) to NULL for this user's tasks
    await query(
      `UPDATE tasks SET assigned_to = NULL WHERE assigned_to = $1`,
      [id]
    );

    await query(
      `DELETE FROM users WHERE id = $1`,
      [id]
    );

    return res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (err) {
    console.error('deleteUser error', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};
