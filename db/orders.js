import db from "./client.js";

export async function createOrder({ date, note, userId }) {
  const {
    rows: [order],
  } = await db.query(
    `
      INSERT INTO orders (date, note, user_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `,
    [date, note || "", userId]
  );

  return order;
}

export async function getOrdersByUser(userId) {
  const { rows } = await db.query(
    `
      SELECT * FROM orders
      WHERE user_id=$1;
    `,
    [userId]
  );

  return rows;
}

export async function getOrderById(id) {
  const {
    rows: [order],
  } = await db.query(
    `
      SELECT * FROM orders
      WHERE id=$1;
    `,
    [id]
  );

  return order;
}

export async function addProductToOrder({ orderId, productId, quantity }) {
  const {
    rows: [orderProduct],
  } = await db.query(
    `
      INSERT INTO order_products (order_id, product_id, quantity)
      VALUES ($1, $2, $3)
      RETURNING *;
    `,
    [orderId, productId, quantity]
  );

  return orderProduct;
}

export async function getProductsInOrder(orderId) {
  const { rows } = await db.query(
    `
    SELECT p.*
    FROM products p
    JOIN order_products op ON p.id = op.product_id
    WHERE op.order_id=$1;
    `,
    [orderId]
  );

  return rows;
}
