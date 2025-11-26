import db from "./client.js";

export async function createProduct({ name, price, description }) {
  const {
    rows: [product],
  } = await db.query(
    `
    INSERT INTO products (name, price, description)
    VALUES ($1, $2, $3)
    RETURNING *;
    `,
    [name, price, description]
  );

  return product;
}

export async function getAllProducts() {
  const { rows } = await db.query(`
    SELECT * FROM products;
  `);
  return rows;
}

export async function getProductById(id) {
  const {
    rows: [product],
  } = await db.query(
    `
      SELECT * FROM products
      WHERE id=$1;
    `,
    [id]
  );
  return product;
}

export async function getOrdersForProduct(productId, userId) {
  const { rows } = await db.query(
    `
    SELECT o.*
    FROM orders o
    JOIN order_products op ON op.order_id = o.id
    WHERE op.product_id=$1
    AND o.user_id=$2;
    `,
    [productId, userId]
  );
  return rows;
}

export async function updateProduct(id, fields) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return;

  const setString = keys.map((key, i) => `"${key}"=$${i + 1}`).join(", ");

  const {
    rows: [product],
  } = await db.query(
    `
    UPDATE products
    SET ${setString}
    WHERE id=$${keys.length + 1}
    RETURNING *;
    `,
    [...Object.values(fields), id]
  );

  return product;
}
