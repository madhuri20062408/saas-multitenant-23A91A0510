// controllers/task.controller.js
const { query } = require('../utils/db');

// Create Task
// POST /api/projects/:projectId/tasks
exports.createTask = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { projectId } = req.params;
    const { title, description, assigneeId, priority, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      });
    }

    // 1) Verify project exists and belongs to tenant
    const projectRes = await query(
      `SELECT id, tenant_id FROM projects WHERE id = $1 AND tenant_id = $2`,
      [projectId, tenantId]
    );

    if (projectRes.rowCount === 0) {
      return res.status(403).json({
        success: false,
        message: 'Project does not belong to this tenant or does not exist',
      });
    }

    // 2) If assigneeId provided, verify user belongs to same tenant
    if (assigneeId) {
      const userRes = await query(
        `SELECT id FROM users WHERE id = $1 AND tenant_id = $2`,
        [assigneeId, tenantId]
      );

      if (userRes.rowCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Assignee does not belong to this tenant',
        });
      }
    }

    // 3) Insert task
    const insertRes = await query(
      `INSERT INTO tasks (
         title,
         description,
         status,
         priority,
         project_id,
         assigned_to,
         tenant_id,
         created_at,
         updated_at
       )
       VALUES ($1, $2, 'todo', $3, $4, $5, $6, NOW(), NOW())
       RETURNING
         id,
         title,
         description,
         status,
         priority,
         project_id AS "projectId",
         assigned_to AS "assignedTo",
         tenant_id AS "tenantId",
         created_at AS "createdAt",
         updated_at AS "updatedAt"`,
      [
        title,
        description || null,
        priority || 'medium',
        projectId,
        assigneeId || null,
        tenantId,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: {
        task: insertRes.rows[0]
      },
    });
  } catch (err) {
    console.error('createTask error', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

// List tasks for a project
// GET /api/projects/:projectId/tasks
exports.listProjectTasks = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { projectId } = req.params;
    const {
      status,
      assignedTo,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    // Verify project belongs to tenant
    const projectRes = await query(
      `SELECT id FROM projects WHERE id = $1 AND tenant_id = $2`,
      [projectId, tenantId]
    );

    if (projectRes.rowCount === 0) {
      return res.status(403).json({
        success: false,
        message: 'Project does not belong to this tenant or does not exist',
      });
    }

    const offset = (Number(page) - 1) * Number(limit);
    const params = [projectId, tenantId];
    let where = 'WHERE t.project_id = $1 AND t.tenant_id = $2';

    if (status) {
      params.push(status);
      where += ` AND t.status = $${params.length}`;
    }

    if (assignedTo) {
      params.push(assignedTo);
      where += ` AND t.assigned_to = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      where += ` AND LOWER(t.title) LIKE $${params.length}`;
    }

    // total count
    const countRes = await query(
      `SELECT COUNT(*)::int AS count
       FROM tasks t
       ${where}`,
      params
    );
    const total = countRes.rows[0].count;

    params.push(limit, offset);

    const listRes = await query(
      `SELECT
         t.id,
         t.title,
         t.description,
         t.status,
         t.priority,
         t.project_id AS "projectId",
         t.assigned_to AS "assignedTo",
         t.tenant_id AS "tenantId",
         t.created_at AS "createdAt",
         t.updated_at AS "updatedAt"
       FROM tasks t
       ${where}
       ORDER BY t.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({
      success: true,
      data: {
        tasks: listRes.rows,
        total,
      },
    });
  } catch (err) {
    console.error('listProjectTasks error', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

// Update task status
// PATCH /api/tasks/:taskId/status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { taskId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const existing = await query(
      `SELECT id FROM tasks WHERE id = $1 AND tenant_id = $2`,
      [taskId, tenantId]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const updateRes = await query(
      `UPDATE tasks
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3
       RETURNING
         id,
         title,
         description,
         status,
         priority,
         project_id AS "projectId",
         assigned_to AS "assignedTo",
         tenant_id AS "tenantId",
         created_at AS "createdAt",
         updated_at AS "updatedAt"`,
      [status, taskId, tenantId]
    );

    return res.json({
      success: true,
      message: 'Task status updated successfully',
      data: updateRes.rows[0],
    });
  } catch (err) {
    console.error('updateTaskStatus error', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

// Update full task
// PUT /api/tasks/:taskId
exports.updateTask = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { taskId } = req.params;
    const { title, description, status, assigneeId, priority } = req.body;

    const existing = await query(
      `SELECT id FROM tasks WHERE id = $1 AND tenant_id = $2`,
      [taskId, tenantId]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // If assigneeId provided, verify user belongs to tenant
    if (assigneeId) {
      const userRes = await query(
        `SELECT id FROM users WHERE id = $1 AND tenant_id = $2`,
        [assigneeId, tenantId]
      );

      if (userRes.rowCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Assignee does not belong to this tenant',
        });
      }
    }

    const updateRes = await query(
      `UPDATE tasks
       SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         status = COALESCE($3, status),
         priority = COALESCE($4, priority),
         assigned_to = COALESCE($5, assigned_to),
         updated_at = NOW()
       WHERE id = $6 AND tenant_id = $7
       RETURNING
         id,
         title,
         description,
         status,
         priority,
         project_id AS "projectId",
         assigned_to AS "assignedTo",
         tenant_id AS "tenantId",
         created_at AS "createdAt",
         updated_at AS "updatedAt"`,
      [
        title || null,
        description || null,
        status || null,
        priority || null,
        assigneeId || null,
        taskId,
        tenantId,
      ]
    );

    return res.json({
      success: true,
      message: 'Task updated successfully',
      data: updateRes.rows[0],
    });
  } catch (err) {
    console.error('updateTask error', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

// Delete task
// DELETE /api/tasks/:taskId
exports.deleteTask = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { taskId } = req.params;

    const existing = await query(
      `SELECT id FROM tasks WHERE id = $1 AND tenant_id = $2`,
      [taskId, tenantId]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    await query(
      `DELETE FROM tasks WHERE id = $1 AND tenant_id = $2`,
      [taskId, tenantId]
    );

    return res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (err) {
    console.error('deleteTask error', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};
