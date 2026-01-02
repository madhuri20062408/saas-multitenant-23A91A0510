const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../utils/db');

function signToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

async function ensureDefaultPlans() {
  const res = await query('SELECT COUNT(*)::int AS count FROM plans');
  if (res.rows[0].count === 0) {
    await query(
      `INSERT INTO plans (name, max_users, max_projects)
       VALUES 
         ('free', 5, 3),
         ('pro', 50, 50),
         ('enterprise', 500, 500)`
    );
  }
}

exports.registerTenant = async (req, res) => {
  const client = await query('BEGIN').then(() => null).catch(() => null);
  try {
    const { tenantName, subdomain, adminName, adminEmail, adminPassword } = req.body;

    if (!tenantName || !subdomain || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    await ensureDefaultPlans();

    const planRes = await query('SELECT id FROM plans WHERE name = $1', ['free']);
    const planId = planRes.rows[0].id;

    await query('BEGIN');

    const tenantRes = await query(
      `INSERT INTO tenants (name, subdomain, plan_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, subdomain, plan_id`,
      [tenantName, subdomain.toLowerCase(), planId]
    );
    const tenant = tenantRes.rows[0];

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const userRes = await query(
      `INSERT INTO users (email, password_hash, name, role, tenant_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, role, tenant_id`,
      [adminEmail.toLowerCase(), hashedPassword, adminName, 'TENANT_ADMIN', tenant.id]
    );
    const user = userRes.rows[0];

    const token = signToken(user);

    await query('COMMIT');

    return res.status(201).json({
      token,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        planId: tenant.plan_id,
      },
      user,
    });
  } catch (err) {
    await query('ROLLBACK').catch(() => {});
    console.error('registerTenant error', err);
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Tenant subdomain or email already exists' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, subdomain } = req.body;

    if (!email || !password || !subdomain) {
      return res.status(400).json({ message: 'Missing email, password, or subdomain' });
    }

    const tenantRes = await query(
      'SELECT id FROM tenants WHERE subdomain = $1',
      [subdomain.toLowerCase()]
    );
    if (tenantRes.rows.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    const tenantId = tenantRes.rows[0].id;

    const userRes = await query(
      `SELECT id, email, password_hash, name, role, tenant_id
       FROM users
       WHERE email = $1 AND tenant_id = $2`,
      [email.toLowerCase(), tenantId]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = userRes.rows[0];

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenant_id,
      },
    });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.me = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const userRes = await query(
      `SELECT u.id, u.email, u.name, u.role, u.tenant_id,
              t.name AS tenant_name, t.subdomain, t.plan_id
       FROM users u
       LEFT JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userRes.rows[0];

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenant_id,
      tenantName: user.tenant_name,
      subdomain: user.subdomain,
      planId: user.plan_id,
    });
  } catch (err) {
    console.error('me error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.logout = async (req, res) => {
  // JWT is stateless; client just deletes token
  return res.json({ message: 'Logged out successfully' });
};
