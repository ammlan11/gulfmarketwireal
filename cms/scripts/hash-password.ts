/*
 * Prints a bcrypt hash of a password, for ADMIN_PASSWORD_HASH in cms/.env.
 *
 *   npm run hash-password -- 'the-new-admin-password'
 *
 * Put the printed line in the server's .env (in single quotes, because the
 * hash contains $ signs), remove ADMIN_PASSWORD, and restart the CMS.
 */
import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password || password.length < 12) {
  console.error("Usage: npm run hash-password -- 'password of 12+ characters'");
  process.exit(1);
}

console.log(`ADMIN_PASSWORD_HASH='${bcrypt.hashSync(password, 12)}'`);
