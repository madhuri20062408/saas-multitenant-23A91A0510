# Multi-Tenant SaaS Platform - Project & Task Management

A production-ready multi-tenant SaaS application enabling multiple organizations to independently manage teams, projects, and tasks with complete data isolation, role-based access control, and subscription management.

## Features

- 🏢 **Multi-Tenancy** - Complete data isolation between organizations using tenant_id
- 🔐 **JWT Authentication** - Secure stateless authentication with 24-hour token expiry
- 👥 **Role-Based Access Control** - Three roles: Super Admin, Tenant Admin, User
- 📊 **Project Management** - Create, update, delete projects with status tracking
- ✅ **Task Management** - Assign tasks with priorities, status updates, descriptions
- 👤 **User Management** - Tenant admins can add/remove users from their organization
- 💳 **Subscription Plans** - Free (5 users, 3 projects), Pro (50 users, 20 projects), Enterprise (500 users, 100 projects)
- 🔒 **Security** - bcrypt password hashing, JWT tokens, tenant isolation, input validation
- 🐳 **Docker Ready** - Full containerization with one-command deployment
- 🏥 **Health Checks** - API health endpoint for monitoring

## Technology Stack

### Frontend
- **React 19.2** - UI library
- **Vite 7.x** - Build tool and dev server
- **Vanilla CSS** - Styling

### Backend
- **Node.js 20.x** - Runtime
- **Express 5.x** - Web framework
- **PostgreSQL 15** - Database
- **Prisma 5.x** - ORM and migrations
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### DevOps
- **Docker & Docker Compose** - Containerization
- **PostgreSQL Container** - Database service
- **Node.js Containers** - Backend and frontend services

## Quick Start with Docker (Recommended)

### Prerequisites
- Docker and Docker Compose installed
- Ports 3000, 5000, 5432 available

### Run Application

```bash
# Clone repository
git clone <your-repo-url>
cd saas-multitenant-23A91A0510

# Start all services (database, backend, frontend)
docker-compose up -d

# Wait 30-60 seconds for initialization
# Check status
docker-compose ps

# All three services should show "Up" and "healthy"

Access Application
Frontend: http://localhost:3000

Backend API: http://localhost:5000

Health Check: http://localhost:5000/api/health

Database: localhost:5432

Test Credentials (Docker)
Tenant Admin:

Subdomain: acme

Email: alice@acme.com

Password: Password123!

Regular User:

Subdomain: acme

Email: bob@acme.com

Password: Password123!

Super Admin:

Email: superadmin@system.com

Password: Admin123!

Access Application
Frontend: http://localhost:3000

Backend API: http://localhost:5000

Health Check: http://localhost:5000/api/health

Database: localhost:5432 (PostgreSQL)

Test Credentials
Tenant Admin (Acme):

Subdomain: acme

Email: alice@acme.com

Password: Password123!

Regular User (Acme):

Subdomain: acme

Email: bob@acme.com

Password: Password123!

Super Admin (No Tenant):

Email: superadmin@system.com

Password: Admin123!

Local Development Setup
Backend Setup
bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env file with your database credentials:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saas_db
# JWT_SECRET=your-secret-key-minimum-32-characters
# PORT=5000

# Push Prisma schema to database (creates tables)
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed database with test data
npx prisma db seed

# Start development server
npm run dev
Backend runs on http://localhost:5000

Frontend Setup
bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
Frontend runs on http://localhost:5173 (Vite default port)

Environment Variables
Backend (.env)
text
# Database Connection
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saas_db

# JWT Configuration
JWT_SECRET=your-secret-key-minimum-32-characters-long-for-security
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000
Important: For Docker deployment, environment variables are defined in docker-compose.yml and override .env file settings.

API Documentation
Authentication Endpoints
Register New Tenant
text
POST /api/auth/register-tenant
Body: {
  "tenantName": "Company Name",
  "subdomain": "company",
  "adminName": "Admin Name",
  "adminEmail": "admin@company.com",
  "adminPassword": "SecurePass123!"
}
Response: { "token": "jwt-token", "tenant": {...}, "user": {...} }
User Login
text
POST /api/auth/login
Body: {
  "email": "user@company.com",
  "password": "password",
  "subdomain": "company"
}
Response: { "token": "jwt-token", "user": {...} }
Get Current User
text
GET /api/auth/me
Headers: { "Authorization": "Bearer <token>" }
Response: { "id": 1, "email": "...", "name": "...", "role": "...", ... }
Project Endpoints
List Projects
text
GET /api/projects
Headers: { "Authorization": "Bearer <token>" }
Response: { "success": true, "data": { "projects": [...], "total": 5 } }
Create Project
text
POST /api/projects
Headers: { "Authorization": "Bearer <token>" }
Body: { "name": "Project Name", "description": "Description" }
Response: { "success": true, "data": { "project": {...} } }
Delete Project
text
DELETE /api/projects/:id
Headers: { "Authorization": "Bearer <token>" }
Response: { "success": true, "message": "Project deleted successfully" }
Task Endpoints
List Project Tasks
text
GET /api/projects/:projectId/tasks
Headers: { "Authorization": "Bearer <token>" }
Response: { "success": true, "data": { "tasks": [...] } }
Create Task
text
POST /api/projects/:projectId/tasks
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "title": "Task Title",
  "description": "Description",
  "priority": "high"
}
Response: { "success": true, "data": { "task": {...} } }
Update Task Status
text
PATCH /api/tasks/:taskId/status
Headers: { "Authorization": "Bearer <token>" }
Body: { "status": "inprogress" }
Response: { "success": true, "data": {...} }
User Management Endpoints
List Tenant Users
text
GET /api/tenants/:tenantId/users
Headers: { "Authorization": "Bearer <token>" }
Response: { "success": true, "data": { "users": [...], "total": 3 } }
Add User to Tenant
text
POST /api/tenants/:tenantId/users
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "email": "newuser@company.com",
  "password": "SecurePass123!",
  "name": "User Name",
  "role": "USER"
}
Response: { "success": true, "data": {...} }
Delete User
text
DELETE /api/users/:userId
Headers: { "Authorization": "Bearer <token>" }
Response: { "success": true, "message": "User deleted successfully" }
Health Check
text
GET /api/health
Response: {
  "success": true,
  "status": "ok",
  "checks": { "database": "up" }
}
Database Schema
Tables
plans

id, name, max_users, max_projects

Pre-seeded with free, pro, enterprise

tenants

id, name, subdomain (unique), plan_id

Organizations using the platform

users

id, email, password_hash, name, role, tenant_id

UNIQUE constraint on (tenant_id, email)

Super admins have tenant_id = NULL

projects

id, name, description, status, tenant_id, created_by

Projects owned by tenants

tasks

id, title, description, status, priority, project_id, tenant_id, assigned_to

Tasks within projects

Relationships
Foreign keys with CASCADE DELETE where appropriate

Indexes on tenant_id columns for performance

Tasks reference both project_id and tenant_id for isolation

Architecture Overview
text
┌─────────────────────────────────────────────────────┐
│                    Browser                          │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS/HTTP
                       ▼
┌──────────────────────────────────────────────────────┐
│              Frontend (React + Vite)                 │
│              Port 3000 (Docker)                      │
│              Port 5173 (Local Dev)                   │
└──────────────────────┬───────────────────────────────┘
                       │ REST API
                       ▼
┌──────────────────────────────────────────────────────┐
│         Backend (Node.js + Express)                  │
│              Port 5000                               │
│  ┌──────────────────────────────────────────┐       │
│  │  Authentication Middleware (JWT)         │       │
│  │  Tenant Isolation Middleware             │       │
│  │  Controllers (Auth, Projects, Tasks,     │       │
│  │               Users, Tenants)            │       │
│  └──────────────────────────────────────────┘       │
└──────────────────────┬───────────────────────────────┘
                       │ SQL Queries
                       ▼
┌──────────────────────────────────────────────────────┐
│         PostgreSQL Database                          │
│              Port 5432                               │
│  Tables: plans, tenants, users, projects, tasks     │
└──────────────────────────────────────────────────────┘
Multi-Tenancy Implementation
Data Isolation Strategy
Shared Database, Shared Schema approach

Every data table has tenant_id column (except plans)

All queries automatically filter by tenant_id from JWT token

Super admins (tenant_id = NULL) can access all tenants

Tenant Identification
Each tenant gets unique subdomain (e.g., acme.yourapp.com)

Login requires: email + password + subdomain

JWT token contains userId, tenantId, and role

Security Measures
Authentication - JWT tokens with 24-hour expiry

Password Security - bcrypt with salt rounds = 10

Tenant Isolation - All API queries filter by tenant_id

Authorization - Role-based access control middleware

Input Validation - Email format, password strength, required fields

Subscription Management
Plan Limits
System enforces user and project limits based on subscription plan:

javascript
// Example: Creating a project
1. Get tenant's max_projects from plan
2. Count existing projects for tenant
3. If count >= max_projects, return 403 Forbidden
4. Otherwise, allow project creation
Default Plan
New tenants automatically start on Free plan

Tenant admins cannot change their own plan

Only super admins can upgrade/downgrade plans

Troubleshooting
Docker Issues
Services won't start:

bash
# Check logs for specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs database

# Rebuild everything from scratch
docker-compose down -v
docker-compose up -d --build
Database connection errors:

Verify DATABASE_URL uses service name database not localhost in docker-compose

Check database is healthy: docker-compose ps

Wait longer for initialization (can take 60s on first run)

API Issues
401 Unauthorized:

Token may have expired (24h limit)

Logout and login again

Check JWT_SECRET matches between backend instances

403 Forbidden:

User doesn't have permission for the action

Verify role in JWT token: Decode at jwt.io

Check tenant_id matches between user and resource

Column errors (password, assignee_id, etc.):

Schema mismatch between SQL and database

Fixed in latest version - use password_hash, assigned_to, created_by

Frontend Issues
Can't see data:

Open browser DevTools → Network tab

Check API calls are reaching backend (should see 200 responses)

Verify CORS is configured in backend server.js

Port 3000 vs 5173:

Docker runs frontend on port 3000

Local dev (npm run dev) runs on port 5173

Both are correct for their respective environments

Testing the Application
Test Flow
Registration

Go to login page

Click "Register here"

Fill form with org name, subdomain, admin details

Verify tenant created and redirects to login

Login & Dashboard

Login with tenant admin credentials

Dashboard shows project count

Navigate to Projects, Users, Tasks

Project Management

Create new project

Click project name to view details

Delete project

Task Management

Open project details

Add task with title, description, priority

Change task status using dropdown

Verify task updates

User Management

Go to Users page (tenant admin only)

Add new user with email, password, name, role

Verify user appears in list

Delete user (not yourself)

Multi-Tenancy

Register second tenant with different subdomain

Login as second tenant admin

Verify cannot see first tenant's data

Deployment Notes
Docker Deployment (Production)
The application is fully containerized and ready for deployment:

bash
# Production deployment
docker-compose up -d

# Verify health
curl http://localhost:5000/api/health

# Monitor logs
docker-compose logs -f
Environment Configuration
For production:

Change JWT_SECRET to strong random value

Use secure DATABASE_URL with strong password

Set NODE_ENV=production

Configure proper FRONTEND_URL for CORS

Scaling Considerations
Database can be moved to managed service (AWS RDS, Azure PostgreSQL)

Frontend can be served via nginx or CDN after build

Backend can run multiple instances behind load balancer

Add Redis for session caching if needed

Development Workflow
Making Changes
bash
# Backend changes
cd backend
npm run dev
# Changes auto-reload with nodemon

# Frontend changes  
cd frontend
npm run dev
# Changes auto-reload with Vite HMR

# Database schema changes
cd backend
# Edit prisma/schema.prisma
npx prisma db push
# Restart backend
Adding New API Endpoints
Create controller function in backend/src/controllers/

Add route in backend/src/routes/

Register route in backend/src/server.js

Add authentication/authorization middleware if needed

Update this README with endpoint documentation

Security Best Practices Implemented
Password Storage - Never stored in plain text, always hashed with bcrypt

JWT Tokens - Contain only non-sensitive data (userId, tenantId, role)

**SQL Injection