// controllers/project.controller.js
const { query } = require('../utils/db');

// GET /api/projects
exports.listProjects = async (req, res) => {
  try {
    const { tenantId } = req.user;

    const result = await query(
      `SELECT 
         p.id,
         p.tenant_id AS "tenantId",
         p.name,
         p.description,
         p.status,
         p.created_by AS "createdBy",
         p.created_at AS "createdAt",
         p.updated_at AS "updatedAt"
       FROM projects p
       WHERE p.tenant_id = $1
       ORDER BY p.created_at DESC`,
      [tenantId]
    );

    return res.json({
      success: true,
      data: {
        projects: result.rows,
        total: result.rows.length,
      },
    });
  } catch (err) {
    console.error('listProjects error', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

// POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required',
      });
    }

    // 1) Get max_projects for this tenant via plan
    const planRes = await query(
      `SELECT p.max_projects
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

    const maxProjects = planRes.rows[0].max_projects;

    // 2) Count existing projects for this tenant
    const countRes = await query(
      `SELECT COUNT(*)::int AS count
       FROM projects
       WHERE tenant_id = $1`,
      [tenantId]
    );

    if (countRes.rows[0].count >= maxProjects) {
      return res.status(403).json({
        success: false,
        message: 'Project limit reached for current plan',
      });
    }

    // 3) Insert project with timestamps
    const insertRes = await query(
      `INSERT INTO projects (name, description, tenant_id, created_by, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING
         id,
         tenant_id AS "tenantId",
         name,
         description,
         status,
         created_by AS "createdBy",
         created_at AS "createdAt",
         updated_at AS "updatedAt"`,
      [name, description || null, tenantId, userId, 'active']
    );

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        project: insertRes.rows[0]
      },
    });
  } catch (err) {
    console.error('createProject error', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

// GET /api/projects/:id
exports.getProjectById = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    const result = await query(
      `SELECT 
         p.id,
         p.tenant_id AS "tenantId",
         p.name,
         p.description,
         p.status,
         p.created_by AS "createdBy",
         p.created_at AS "createdAt",
         p.updated_at AS "updatedAt"
       FROM projects p
       WHERE p.id = $1 AND p.tenant_id = $2`,
      [id, tenantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('getProjectById error', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

// PUT /api/projects/:id
exports.updateProject = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    const { name, description, status } = req.body;

    const existing = await query(
      `SELECT id FROM projects WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const updateRes = await query(
      `UPDATE projects
       SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         status = COALESCE($3, status),
         updated_at = NOW()
       WHERE id = $4 AND tenant_id = $5
       RETURNING
         id,
         tenant_id AS "tenantId",
         name,
         description,
         status,
         created_by AS "createdBy",
         created_at AS "createdAt",
         updated_at AS "updatedAt"`,
      [name || null, description || null, status || null, id, tenantId]
    );

    return res.json({
      success: true,
      message: 'Project updated successfully',
      data: updateRes.rows[0],
    });
  } catch (err) {
    console.error('updateProject error', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

// DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    const existing = await query(
      `SELECT id FROM projects WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    await query(
      `DELETE FROM projects WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    return res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (err) {
    console.error('deleteProject error', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};
