-- Seed data for RBAC system
-- Password for all seed users: Password123!
-- bcrypt hash generated with 12 rounds

USE rbac_db;

-- Roles
INSERT INTO roles (id, name, description) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Admin',    'Full system access'),
  ('11111111-1111-1111-1111-111111111102', 'Maker',    'Creates change requests requiring approval'),
  ('11111111-1111-1111-1111-111111111103', 'Approver', 'Reviews and approves/rejects requests'),
  ('11111111-1111-1111-1111-111111111104', 'User',     'Standard read-only access')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Permissions
INSERT INTO permissions (id, name, description, resource, action) VALUES
  ('22222222-2222-2222-2222-222222222201', 'users:create',     'Create users',              'users',     'create'),
  ('22222222-2222-2222-2222-222222222202', 'users:read',       'View users',                'users',     'read'),
  ('22222222-2222-2222-2222-222222222203', 'users:update',     'Update users',              'users',     'update'),
  ('22222222-2222-2222-2222-222222222204', 'users:delete',     'Delete users',              'users',     'delete'),
  ('22222222-2222-2222-2222-222222222205', 'users:activate',   'Activate users',            'users',     'activate'),
  ('22222222-2222-2222-2222-222222222206', 'users:deactivate', 'Deactivate users',          'users',     'deactivate'),
  ('22222222-2222-2222-2222-222222222207', 'users:reset_password', 'Reset user passwords',  'users',     'reset_password'),
  ('22222222-2222-2222-2222-222222222208', 'approvals:read',   'View approval requests',    'approvals', 'read'),
  ('22222222-2222-2222-2222-222222222209', 'approvals:approve','Approve requests',          'approvals', 'approve'),
  ('22222222-2222-2222-2222-222222222210', 'approvals:reject', 'Reject requests',           'approvals', 'reject'),
  ('22222222-2222-2222-2222-222222222211', 'audit:read',       'View audit logs',           'audit',     'read'),
  ('22222222-2222-2222-2222-222222222212', 'approvals:cancel', 'Cancel own pending requests','approvals', 'cancel'),
  ('22222222-2222-2222-2222-222222222213', 'approval_config:read',   'View approval configuration', 'approval_config', 'read'),
  ('22222222-2222-2222-2222-222222222214', 'approval_config:update', 'Update approval configuration','approval_config', 'update')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Admin: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111101', id FROM permissions
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Maker permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222201'),
  ('11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222202'),
  ('11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222203'),
  ('11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222207'),
  ('11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222208'),
  ('11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222212')
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Approver permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222202'),
  ('11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222208'),
  ('11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222209'),
  ('11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222210')
ON DUPLICATE KEY UPDATE role_id = role_id;

-- User permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('11111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222202')
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Approval configurations
INSERT INTO approval_configurations (id, action_type, requires_approval, min_approvers, description) VALUES
  ('33333333-3333-3333-3333-333333333301', 'users:create',         1, 1, 'Creating a user requires approval'),
  ('33333333-3333-3333-3333-333333333302', 'users:update',         1, 1, 'Updating a user requires approval'),
  ('33333333-3333-3333-3333-333333333303', 'users:delete',         1, 1, 'Deleting a user requires approval'),
  ('33333333-3333-3333-3333-333333333304', 'users:activate',       1, 1, 'Activating a user requires approval'),
  ('33333333-3333-3333-3333-333333333305', 'users:deactivate',     1, 1, 'Deactivating a user requires approval'),
  ('33333333-3333-3333-3333-333333333306', 'users:reset_password', 0, 1, 'Password reset does not require approval')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Seed users (password: Password123!)
INSERT INTO users (id, email, password_hash, first_name, last_name, is_active) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@example.com',    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYGKqJZqKqKq', 'System', 'Admin',    1),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'maker@example.com',    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYGKqJZqKqKq', 'Alice',  'Maker',    1),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'approver@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYGKqJZqKqKq', 'Bob',    'Approver', 1),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'user@example.com',     '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYGKqJZqKqKq', 'Carol',  'User',     1)
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name),
  password_hash = VALUES(password_hash),
  is_active = VALUES(is_active),
  deleted_at = NULL;

INSERT INTO user_roles (user_id, role_id) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111101'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111102'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111103'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111104')
ON DUPLICATE KEY UPDATE user_id = user_id;
