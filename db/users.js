// db/users.js
import db from "./client.js";
import bcrypt from "bcrypt";

export async function createUser({ username, password }) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const {
    rows: [user],
  } = await db.query(
    `
      INSERT INTO users (username, password_hash)
      VALUES ($1, $2)
      RETURNING id, username;
    `,
    [username, hashedPassword]
  );

  return user;
}

export async function getUserByUsername(username) {
  const {
    rows: [user],
  } = await db.query(
    `
      SELECT * FROM users
      WHERE username = $1;
    `,
    [username]
  );

  return user;
}

export async function validateUser({ username, password }) {
  const user = await getUserByUsername(username);
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;

  return { id: user.id, username: user.username };
}
