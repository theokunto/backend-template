-- RBAC + Maker-Approver Workflow Schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS rbac_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE rbac_db;

-- ---------------------------------------------------------------------------
-- Core identity
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    TIMESTAMP    NULL DEFAULT NULL,
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_is_active (is_active),
  KEY idx_users_deleted_at (deleted_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS roles (
  id          CHAR(36)     NOT NULL PRIMARY KEY,
  name        VARCHAR(50)  NOT NULL,
  description VARCHAR(255) NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS permissions (
  id          CHAR(36)     NOT NULL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  resource    VARCHAR(50)  NOT NULL,
  action      VARCHAR(50)  NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_permissions_name (name),
  UNIQUE KEY uq_permissions_resource_action (resource, action)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       CHAR(36)  NOT NULL,
  permission_id CHAR(36)  NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id    CHAR(36)  NOT NULL,
  role_id    CHAR(36)  NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Approval workflow
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS approval_configurations (
  id                 CHAR(36)     NOT NULL PRIMARY KEY,
  action_type        VARCHAR(100) NOT NULL,
  requires_approval  TINYINT(1)   NOT NULL DEFAULT 1,
  min_approvers      INT          NOT NULL DEFAULT 1,
  is_active          TINYINT(1)   NOT NULL DEFAULT 1,
  description        VARCHAR(255) NULL,
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_approval_config_action (action_type)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS approval_requests (
  id               CHAR(36)     NOT NULL PRIMARY KEY,
  action_type      VARCHAR(100) NOT NULL,
  entity_type      VARCHAR(50)  NOT NULL,
  entity_id        CHAR(36)     NULL,
  payload          JSON         NOT NULL,
  status           ENUM('pending', 'approved', 'rejected', 'executed', 'failed', 'cancelled')
                   NOT NULL DEFAULT 'pending',
  requested_by     CHAR(36)     NOT NULL,
  approved_by      CHAR(36)     NULL,
  rejected_by      CHAR(36)     NULL,
  rejection_reason TEXT         NULL,
  approval_count   INT          NOT NULL DEFAULT 0,
  min_approvers    INT          NOT NULL DEFAULT 1,
  execution_error  TEXT         NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  executed_at      TIMESTAMP    NULL,
  CONSTRAINT fk_ar_requested_by FOREIGN KEY (requested_by) REFERENCES users (id),
  CONSTRAINT fk_ar_approved_by FOREIGN KEY (approved_by) REFERENCES users (id),
  CONSTRAINT fk_ar_rejected_by FOREIGN KEY (rejected_by) REFERENCES users (id),
  KEY idx_ar_status (status),
  KEY idx_ar_action_type (action_type),
  KEY idx_ar_requested_by (requested_by),
  KEY idx_ar_created_at (created_at)
) ENGINE=InnoDB;

-- Future: multiple approvers per request
CREATE TABLE IF NOT EXISTS approval_request_approvers (
  id                  CHAR(36)  NOT NULL PRIMARY KEY,
  approval_request_id CHAR(36)  NOT NULL,
  approver_id         CHAR(36)  NOT NULL,
  decision            ENUM('approved', 'rejected') NOT NULL,
  comment             TEXT      NULL,
  decided_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ara_request_approver (approval_request_id, approver_id),
  CONSTRAINT fk_ara_request FOREIGN KEY (approval_request_id) REFERENCES approval_requests (id) ON DELETE CASCADE,
  CONSTRAINT fk_ara_approver FOREIGN KEY (approver_id) REFERENCES users (id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Refresh tokens (session management)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          CHAR(36)     NOT NULL PRIMARY KEY,
  user_id     CHAR(36)     NOT NULL,
  token_hash  VARCHAR(64)  NOT NULL,
  family_id   CHAR(36)     NOT NULL,
  expires_at  TIMESTAMP    NOT NULL,
  revoked_at  TIMESTAMP    NULL DEFAULT NULL,
  replaced_by CHAR(36)     NULL DEFAULT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_rt_replaced_by FOREIGN KEY (replaced_by) REFERENCES refresh_tokens (id) ON DELETE SET NULL,
  UNIQUE KEY uq_refresh_token_hash (token_hash),
  KEY idx_rt_user_id (user_id),
  KEY idx_rt_family_id (family_id),
  KEY idx_rt_expires_at (expires_at)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Audit trail
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  entity_type VARCHAR(50)  NOT NULL,
  entity_id   CHAR(36)     NULL,
  action      VARCHAR(100) NOT NULL,
  actor_id    CHAR(36)     NULL,
  details     JSON         NULL,
  ip_address  VARCHAR(45)  NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL,
  KEY idx_audit_entity (entity_type, entity_id),
  KEY idx_audit_actor (actor_id),
  KEY idx_audit_action (action),
  KEY idx_audit_created_at (created_at)
) ENGINE=InnoDB;
