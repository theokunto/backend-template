# Production Deployment Best Practices

## Infrastructure

### Database (MySQL 8.0+)

- Use a managed service (AWS RDS, Azure Database, Cloud SQL) with automated backups.
- Enable SSL/TLS for all connections.
- Create a dedicated application user with least-privilege grants (no `DROP`, `ALTER` in production).
- Set `innodb_flush_log_at_trx_commit = 1` for durability.
- Configure connection pooling: match `DB_POOL_MAX` to expected concurrency (typically 10–50 per instance).

### Application

- Run behind a reverse proxy (Nginx, ALB) with TLS termination.
- Use **PM2**, **Docker**, or **Kubernetes** for process management.
- Set `NODE_ENV=production`.
- Never use default `JWT_SECRET` — generate with `openssl rand -base64 64`.

### Environment Variables

```bash
NODE_ENV=production
PORT=3000
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_USER=rbac_app
DB_PASSWORD=<from-secrets-manager>
DB_NAME=rbac_db
JWT_SECRET=<64-byte-random-string>
BCRYPT_ROUNDS=12
```

Store secrets in AWS Secrets Manager, HashiCorp Vault, or equivalent — not in `.env` files on disk.

## Security Checklist

- [ ] HTTPS everywhere (TLS 1.2+)
- [ ] Strong JWT secret, short expiry (`JWT_EXPIRES_IN=15m` + refresh tokens for production)
- [ ] Rate limiting on `/auth/login` (e.g. `express-rate-limit`)
- [ ] Input validation on all endpoints (Joi — already implemented)
- [ ] Helmet security headers (already implemented)
- [ ] CORS restricted to known origins in production
- [ ] Password policy enforcement (min length, complexity)
- [ ] Audit log retention policy (partition or archive `audit_logs` by date)
- [ ] Regular dependency audits (`npm audit`)

## Docker Example

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 3000
USER node
CMD ["node", "src/server.js"]
```

## Health Checks

- `GET /api/v1/health` — liveness probe
- Extend with DB connectivity check for readiness probe

## Monitoring & Observability

- Structured JSON logging (replace `console.log` with pino/winston in production)
- Request correlation IDs via middleware
- Metrics: request latency, error rate, approval queue depth
- Alert on failed approval executions (`status = failed`)

## Scaling Considerations

- **Stateless API** — horizontal scaling behind load balancer
- **Database** — read replicas for audit log queries
- **Approval queue** — monitor `pending` count; consider background job for stale requests
- **Multi-approver** — `min_approvers` and `approval_request_approvers` already support N-of-M

## Database Migrations

- Run `npm run db:migrate` as a deployment step (CI/CD job, not at app startup)
- Version migrations with a tool like Flyway or Liquibase for team workflows
- Never run `db:seed` in production

## Backup & Recovery

- Daily automated MySQL backups with point-in-time recovery
- Test restore procedures quarterly
- `audit_logs` are append-only — consider separate archival to cold storage after 90 days

## CI/CD Pipeline

```
lint → test → build image → migrate DB → deploy → smoke test /health
```
