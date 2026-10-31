import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateAuthCredentials, USERNAME_REGEX } from '../src/utils/validation.js';

describe('validateAuthCredentials', () => {
  describe('USERNAME_REGEX', () => {
    it('matches valid alphanumeric usernames and underscores between 3 and 20 chars', () => {
      assert.strictEqual(USERNAME_REGEX.test('alice'), true);
      assert.strictEqual(USERNAME_REGEX.test('bob_123'), true);
      assert.strictEqual(USERNAME_REGEX.test('Player_One'), true);
      assert.strictEqual(USERNAME_REGEX.test('abc'), true);
      assert.strictEqual(USERNAME_REGEX.test('a'.repeat(20)), true);
    });

    it('rejects usernames that are too short or too long', () => {
      assert.strictEqual(USERNAME_REGEX.test('ab'), false);
      assert.strictEqual(USERNAME_REGEX.test(''), false);
      assert.strictEqual(USERNAME_REGEX.test('a'.repeat(21)), false);
    });

    it('rejects usernames with invalid characters or spaces', () => {
      assert.strictEqual(USERNAME_REGEX.test('user name'), false);
      assert.strictEqual(USERNAME_REGEX.test('user@name'), false);
      assert.strictEqual(USERNAME_REGEX.test('user!'), false);
      assert.strictEqual(USERNAME_REGEX.test('user-name'), false);
    });
  });

  describe('validateAuthCredentials function', () => {
    it('returns null for valid credentials', () => {
      assert.strictEqual(validateAuthCredentials('valid_user', 'password123'), null);
      assert.strictEqual(validateAuthCredentials('alice', 'a'.repeat(72)), null);
      assert.strictEqual(validateAuthCredentials('bob99', '12345678'), null);
    });

    it('returns appropriate error for invalid usernames', () => {
      const expectedMsg = 'Username must be 3–20 characters long and contain only letters, numbers, and underscores.';
      assert.strictEqual(validateAuthCredentials('', 'validpassword'), expectedMsg);
      assert.strictEqual(validateAuthCredentials('   ', 'validpassword'), expectedMsg);
      assert.strictEqual(validateAuthCredentials('no', 'validpassword'), expectedMsg);
      assert.strictEqual(validateAuthCredentials('a'.repeat(21), 'validpassword'), expectedMsg);
      assert.strictEqual(validateAuthCredentials('bad user', 'validpassword'), expectedMsg);
      assert.strictEqual(validateAuthCredentials(null, 'validpassword'), expectedMsg);
    });

    it('returns appropriate error for invalid passwords', () => {
      const expectedMsg = 'Password must be between 8 and 72 characters.';
      assert.strictEqual(validateAuthCredentials('validuser', ''), expectedMsg);
      assert.strictEqual(validateAuthCredentials('validuser', 'short'), expectedMsg);
      assert.strictEqual(validateAuthCredentials('validuser', '1234567'), expectedMsg);
      assert.strictEqual(validateAuthCredentials('validuser', 'a'.repeat(73)), expectedMsg);
      assert.strictEqual(validateAuthCredentials('validuser', null), expectedMsg);
    });
  });
});

