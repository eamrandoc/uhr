import bcrypt from "bcryptjs";
import config from "../config";

/**
 * Hashes a plaintext password using bcryptjs and the salt rounds configured in the environment.
 * @param password Plaintext password to hash
 * @returns Cryptographically secure hashed password string
 */
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, config.bcryptSaltRounds);
};

/**
 * Cryptographically compares a plaintext password with a stored hash.
 * @param password Plaintext password to verify
 * @param hashed Stored password hash
 * @returns True if password matches the hash, false otherwise
 */
const comparePassword = async (password: string, hashed: string): Promise<boolean> => {
  return bcrypt.compare(password, hashed);
};

export const passwordHelpers = {
  hashPassword,
  comparePassword,
};
