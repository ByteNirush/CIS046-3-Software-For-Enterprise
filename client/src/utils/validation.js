/**
 * Username validation regex: 3 to 20 alphanumeric characters or underscores.
 */
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

/**
 * Validates authentication credentials on the client before submission.
 * @param {string} username
 * @param {string} password
 * @returns {string|null} Error message or null if valid
 */
export function validateAuthCredentials(username, password) {
  if (!username || !username.trim() || !USERNAME_REGEX.test(username.trim())) {
    return 'Username must be 3–20 characters long and contain only letters, numbers, and underscores.';
  }
  if (!password || password.length < 8 || password.length > 72) {
    return 'Password must be between 8 and 72 characters.';
  }
  return null;
}

export default validateAuthCredentials;

