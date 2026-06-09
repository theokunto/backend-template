const SEED_PASSWORD = 'Password123!';

const SEED_USERS = {
  admin: {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    email: 'admin@example.com',
    role: 'Admin',
  },
  maker: {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    email: 'maker@example.com',
    role: 'Maker',
  },
  approver: {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    email: 'approver@example.com',
    role: 'Approver',
  },
  user: {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    email: 'user@example.com',
    role: 'User',
  },
};

const SEED_USER_IDS = Object.values(SEED_USERS).map((u) => u.id);

module.exports = { SEED_PASSWORD, SEED_USERS, SEED_USER_IDS };
