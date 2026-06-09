const path = require('path');
const dotenv = require('dotenv');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-integration-tests';
process.env.DB_NAME = process.env.DB_NAME || 'rbac_db_test';
process.env.BCRYPT_ROUNDS = '4';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
