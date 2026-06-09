# RBAC Backend with Maker-Approver Workflow

Production-ready Role-Based Access Control API built with **Node.js**, **Express.js**, and **MySQL**.

## Features

- JWT authentication
- Permission-based RBAC (not role-name checks)
- Maker-Approver workflow for sensitive operations
- Configurable approval requirements per action
- Complete audit trail
- Transactional approval + execution
- Self-approval prevention
- Multi-approver support (via `min_approvers`)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials

# 3. Create schema
npm run db:migrate

# 4. Seed roles, permissions, and test users
npm run db:seed

# 5. Start server
npm run dev
```

## Seed Users

| Email | Role | Password |
|-------|------|----------|
| admin@example.com | Admin | Password123! |
| maker@example.com | Maker | Password123! |
| approver@example.com | Approver | Password123! |
| user@example.com | User | Password123! |

## Maker-Approver Example

```bash
# 1. Maker logs in
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maker@example.com","password":"Password123!"}'

# 2. Maker submits user creation (returns 202 + approval request)
curl -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer <maker_token>" \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"Pass12345!","firstName":"New","lastName":"User"}'

# 3. Approver approves the request (user is created)
curl -X POST http://localhost:3000/api/v1/approvals/<request_id>/approve \
  -H "Authorization: Bearer <approver_token>" \
  -H "Content-Type: application/json" \
  -d '{"comment":"Approved"}'
```

## New in v1.1

- **Health probes:** `GET /api/v1/health/live`, `GET /api/v1/health/ready`
- **Rate limiting** on login and refresh endpoints
- **Structured logging** via pino
- **Token cleanup job:** `npm run jobs:cleanup-tokens`
- **Approval config admin API:** `GET/PATCH /api/v1/approval-configurations/:actionType`
- **Approval UX:** filters, cancel pending request, optional webhook (`APPROVAL_WEBHOOK_URL`)
- **API docs:** Swagger UI at `/api/v1/docs`

## Tests

```bash
npm test              # unit + contract + integration (40 tests)
npm run test:unit
npm run test:contract
npm run test:integration
```

## Integration Tests

Tests use a separate database (`rbac_db_test` by default) and require a running MySQL instance.

```bash
# Optional: copy test env overrides
cp .env.test.example .env.test

# Install dependencies (includes supertest)
npm install

# Run integration tests (sequential — shared DB state)
npm test
```

Tests run in order: auth → rbac → users → approval-workflow (the last suite is the slowest).

Tests auto-skip with a message when MySQL is unavailable. To force-skip: `SKIP_DB_TESTS=true npm test`.

If the run appeared to freeze on "Maker-Approver workflow", it was likely the MySQL connection pool keeping Node alive (now closed via a teardown hook) or the first-time DB migration taking longer on a cold start.

**Coverage:**
- Authentication (login, profile, 401 handling)
- RBAC permission enforcement
- Maker-Approver workflow (approve, reject, self-approval block)
- Immediate execution for non-approval actions (password reset)
- Audit trail verification
- User CRUD validation

## Documentation

- [System Architecture](docs/ARCHITECTURE.md)
- [API Specification](docs/API.md)
- [Production Deployment](docs/DEPLOYMENT.md)

## Project Structure

```
src/
├── config/          # App & database configuration
├── constants/       # Permission & action type constants
├── controllers/     # HTTP request handlers
├── middleware/      # Auth, RBAC, validation, errors
├── repositories/    # MySQL data access
├── routes/          # Express route definitions
├── services/        # Business logic & workflows
├── utils/           # JWT, password, errors
└── validators/      # Joi schemas
database/
├── schema.sql       # MySQL schema
└── seeds.sql        # Roles, permissions, config
```

## Approval Configuration

Configured in `approval_configurations` table:

| Action | Requires Approval |
|--------|-------------------|
| users:create | Yes |
| users:update | Yes |
| users:delete | Yes |
| users:activate | Yes |
| users:deactivate | Yes |
| users:reset_password | **No** |

## License

MIT
