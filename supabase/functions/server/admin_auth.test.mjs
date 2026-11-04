import test from 'node:test';
import assert from 'node:assert/strict';
import { isAdminUser } from './admin_auth.js';

test('allowlisted email is accepted even without app metadata', () => {
  const user = {
    email: 'owner@shabacrafts.store',
    email_confirmed_at: '2025-01-01T00:00:00Z',
    app_metadata: {},
    user_metadata: {},
    raw_app_meta_data: {},
    raw_user_meta_data: {},
  };

  assert.equal(isAdminUser(user, ['owner@shabacrafts.store']), true);
});

test('role metadata is accepted in both app_metadata and raw_app_meta_data', () => {
  const userWithAppRole = {
    email: 'studio@shabacrafts.store',
    email_confirmed_at: '2025-01-01T00:00:00Z',
    app_metadata: { role: 'admin' },
    user_metadata: {},
    raw_app_meta_data: { role: 'admin' },
    raw_user_meta_data: {},
  };

  const userWithLegacyFlag = {
    email: 'studio@shabacrafts.store',
    email_confirmed_at: '2025-01-01T00:00:00Z',
    app_metadata: { is_admin: true },
    user_metadata: {},
    raw_app_meta_data: { is_admin: true },
    raw_user_meta_data: {},
  };

  assert.equal(isAdminUser(userWithAppRole, []), true);
  assert.equal(isAdminUser(userWithLegacyFlag, []), true);
});

test('unconfirmed email and non-admin users are rejected', () => {
  const unconfirmed = {
    email: 'guest@shabacrafts.store',
    email_confirmed_at: null,
    app_metadata: {},
    user_metadata: {},
    raw_app_meta_data: {},
    raw_user_meta_data: {},
  };

  const nonAdmin = {
    email: 'guest@shabacrafts.store',
    email_confirmed_at: '2025-01-01T00:00:00Z',
    app_metadata: { role: 'user' },
    user_metadata: { role: 'admin', is_admin: true },
    raw_app_meta_data: { role: 'user' },
    raw_user_meta_data: { role: 'admin', is_admin: true },
  };

  assert.equal(isAdminUser(unconfirmed, ['guest@shabacrafts.store']), false);
  assert.equal(isAdminUser(nonAdmin, []), false);
});
