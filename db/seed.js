import db from "./client.js";
import bcrypt from "bcrypt";

async function seed() {
  try {
    await db.connect();
    console.log("🌱 Database connected.");

    await db.query(`
      DELETE FROM order_products;
      DELETE FROM orders;
      DELETE FROM products;
      DELETE FROM users;
    `);

    const hashedPassword = await bcrypt.hash("password123", 10);
    const {
      rows: [user],
    } = await db.query(
      `INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *;`,
      ["alice", hashedPassword]
    );

    const productList = [];
    for (let i = 1; i <= 10; i++) {
      const {
        rows: [product],
      } = await db.query(
        `INSERT INTO products (title, description, price)
          VALUES ($1, $2, $3) RETURNING *;`,
        [`Product ${i}`, `Description for product ${i}`, 10 * i]
      );
      productList.push(product);
    }

    const {
      rows: [order],
    } = await db.query(
      `INSERT INTO orders (date, note, user_id) VALUES ($1, $2, $3) RETURNING *;`,
      [new Date(), "first order", user.id]
    );

    for (let product of productList) {
      await db.query(
        `INSERT INTO order_products (order_id, product_id, quantity)
          VALUES ($1, $2, $3);`,
        [order.id, product.id, 2]
      );
    }

    console.log("✅ Database seeded successfully!");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
  } finally {
    await db.end();
  }
}

seed();
