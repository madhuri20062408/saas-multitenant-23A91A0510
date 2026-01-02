
INSERT INTO plans (name, max_users, max_projects) VALUES
  ('free', 5, 3),
  ('pro', 25, 15),
  ('enterprise', 100, 50)
ON CONFLICT (name) DO NOTHING;


INSERT INTO tenants (name, subdomain, plan_id)
VALUES
  ('Acme Corp', 'acme', (SELECT id FROM plans WHERE name = 'free')),
  ('Demo Company', 'demo', (SELECT id FROM plans WHERE name = 'pro'))
ON CONFLICT (subdomain) DO NOTHING;


INSERT INTO users (email, password, name, role, tenant_id)
VALUES
  ('alice@acme.com', 'Password123!', 'Alice Acme', 'TENANT_ADMIN',
   (SELECT id FROM tenants WHERE subdomain = 'acme')),
  ('user1@acme.com', 'User123!', 'User One', 'USER',
   (SELECT id FROM tenants WHERE subdomain = 'acme'))
ON CONFLICT (email, tenant_id) DO NOTHING;


INSERT INTO users (email, password, name, role, tenant_id)
VALUES
  ('admin@demo.com', 'Demo123!', 'Demo Admin', 'TENANT_ADMIN',
   (SELECT id FROM tenants WHERE subdomain = 'demo')),
  ('user1@demo.com', 'DemoUser123!', 'Demo User', 'USER',
   (SELECT id FROM tenants WHERE subdomain = 'demo'))
ON CONFLICT (email, tenant_id) DO NOTHING;


INSERT INTO projects (name, description, tenant_id, created_by_id)
VALUES
  ('Acme Website', 'Main site for Acme',
   (SELECT id FROM tenants WHERE subdomain = 'acme'),
   (SELECT id FROM users WHERE email = 'alice@acme.com' AND tenant_id = (SELECT id FROM tenants WHERE subdomain = 'acme'))),
  ('Acme Mobile App', 'Mobile app project',
   (SELECT id FROM tenants WHERE subdomain = 'acme'),
   (SELECT id FROM users WHERE email = 'alice@acme.com' AND tenant_id = (SELECT id FROM tenants WHERE subdomain = 'acme')));


INSERT INTO projects (name, description, tenant_id, created_by_id)
VALUES
  ('Demo CRM', 'CRM system for Demo Company',
   (SELECT id FROM tenants WHERE subdomain = 'demo'),
   (SELECT id FROM users WHERE email = 'admindemo.com' AND tenant_id = (SELECT id FROM tenants WHERE subdomain = 'demo'))),
  ('Demo Analytics', 'Analytics dashboard',
   (SELECT id FROM tenants WHERE subdomain = 'demo'),
   (SELECT id FROM users WHERE email = 'admindemo.com' AND tenant_id = (SELECT id FROM tenants WHERE subdomain = 'demo')));
