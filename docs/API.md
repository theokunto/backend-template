# API Specification

Base URL: `http://localhost:3000/api/v1`

All authenticated endpoints require:
```
Authorization: Bearer <access_token>
```

## Authentication

### POST /auth/login

**Request:**
```json
{
  "email": "maker@example.com",
  "password": "Password123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "k7x9mP2nQvR8sT1uVw3yZ4aB5cD6eF7gH8iJ9kL0mN1oP2qR3sT4uV5wX6yZ7a",
    "user": {
      "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "email": "maker@example.com",
      "firstName": "Alice",
      "lastName": "Maker",
      "roles": ["Maker"],
      "permissions": ["users:create", "users:read", "users:update", "users:reset_password", "approvals:read"]
    }
  }
}
```

### POST /auth/refresh

Exchange a valid refresh token for a new access token and rotated refresh token.

**Request:**
```json
{
  "refreshToken": "<refresh_token_from_login>"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "new-rotated-refresh-token"
  }
}
```

### POST /auth/logout

Revoke a single refresh token (session).

**Request:**
```json
{
  "refreshToken": "<refresh_token>"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": { "loggedOut": true }
}
```

### POST /auth/logout-all

Revoke all refresh tokens for the authenticated user. Requires access token.

**Response (200):**
```json
{
  "success": true,
  "message": "All sessions cleared",
  "data": { "loggedOut": true }
}
```

### GET /auth/me

Returns the authenticated user's profile and permissions.

---

## Users

All endpoints require the corresponding permission.

| Method | Endpoint | Permission | Approval Required |
|--------|----------|------------|-------------------|
| GET | /users | users:read | No |
| GET | /users/:id | users:read | No |
| POST | /users | users:create | **Yes** |
| PATCH | /users/:id | users:update | **Yes** |
| DELETE | /users/:id | users:delete | **Yes** |
| POST | /users/:id/activate | users:activate | **Yes** |
| POST | /users/:id/deactivate | users:deactivate | **Yes** |
| POST | /users/:id/reset-password | users:reset_password | **No** |

### POST /users — Create User (Maker submits for approval)

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "firstName": "New",
  "lastName": "User",
  "isActive": true,
  "roleIds": ["11111111-1111-1111-1111-111111111104"]
}
```

**Response (202 — approval required):**
```json
{
  "success": true,
  "message": "User creation request submitted for approval",
  "data": {
    "requiresApproval": true,
    "approvalRequest": {
      "id": "e5f6a7b8-c9d0-1234-5678-90abcdef1234",
      "actionType": "users:create",
      "entityType": "user",
      "entityId": null,
      "payload": {
        "email": "newuser@example.com",
        "firstName": "New",
        "lastName": "User",
        "isActive": true
      },
      "status": "pending",
      "requestedBy": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "approvalCount": 0,
      "minApprovers": 1,
      "createdAt": "2026-06-08T10:00:00.000Z"
    }
  }
}
```

### POST /users/:id/reset-password — Immediate execution

**Request:**
```json
{
  "newPassword": "NewSecurePass456!"
}
```

**Response (200 — no approval required):**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "requiresApproval": false,
    "result": {
      "passwordReset": true
    }
  }
}
```

---

## Approvals

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | /approvals | approvals:read |
| GET | /approvals/:id | approvals:read |
| POST | /approvals/:id/approve | approvals:approve |
| POST | /approvals/:id/reject | approvals:reject |

### POST /approvals/:id/approve

**Request:**
```json
{
  "comment": "Verified new hire details"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Request approved and executed successfully",
  "data": {
    "approvalRequest": {
      "id": "e5f6a7b8-c9d0-1234-5678-90abcdef1234",
      "status": "executed",
      "approvedBy": "cccccccc-cccc-cccc-cccc-cccccccccccc",
      "executedAt": "2026-06-08T10:05:00.000Z"
    },
    "executed": true,
    "result": {
      "id": "f1f2f3f4-a5b6-7890-cdef-1234567890ab",
      "email": "newuser@example.com",
      "firstName": "New",
      "lastName": "User",
      "isActive": true
    }
  }
}
```

### POST /approvals/:id/reject

**Request:**
```json
{
  "reason": "Duplicate email address in HR system"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Request rejected",
  "data": {
    "approvalRequest": {
      "id": "e5f6a7b8-c9d0-1234-5678-90abcdef1234",
      "status": "rejected",
      "rejectedBy": "cccccccc-cccc-cccc-cccc-cccccccccccc",
      "rejectionReason": "Duplicate email address in HR system"
    }
  }
}
```

### Error: Self-approval blocked (403)

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You cannot approve your own request"
  }
}
```

---

## Audit Logs

### GET /audit-logs

**Permission:** `audit:read`

**Query params:** `entityType`, `entityId`, `actorId`, `page`, `limit`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "entity_type": "approval_request",
      "entity_id": "e5f6a7b8-c9d0-1234-5678-90abcdef1234",
      "action": "approval.request_created",
      "actor_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "details": { "actionType": "users:create" },
      "ip_address": "127.0.0.1",
      "created_at": "2026-06-08T10:00:00.000Z"
    },
    {
      "id": 2,
      "entity_type": "approval_request",
      "entity_id": "e5f6a7b8-c9d0-1234-5678-90abcdef1234",
      "action": "approval.approved",
      "actor_id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
      "created_at": "2026-06-08T10:05:00.000Z"
    },
    {
      "id": 3,
      "entity_type": "approval_request",
      "entity_id": "e5f6a7b8-c9d0-1234-5678-90abcdef1234",
      "action": "approval.executed",
      "actor_id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
      "created_at": "2026-06-08T10:05:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 50 }
}
```

---

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid request body |
| 401 | UNAUTHORIZED | Missing/invalid JWT |
| 403 | FORBIDDEN | Missing permission or self-approval |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Duplicate or invalid state transition |
| 500 | INTERNAL_ERROR | Server error |

**Format:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```
