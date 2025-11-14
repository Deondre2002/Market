import express from "express";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "./db/client.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ error: "Unauthorized" });
    req.user = user;
    next();
  });
}

app.post("/users/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Missing username or password" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const {
      rows: [user],
    } = await db.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
      [username, hashedPassword]
    );

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "User registration failed" });
  }
});

app.post("/users/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Missing username or password" });

  try {
    const {
      rows: [user],
    } = await db.query("SELECT * FROM users WHERE username=$1", [username]);
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/products", async (req, res) => {
  const { rows } = await db.query("SELECT * FROM products");
  res.json(rows);
});

app.get("/products/:id", async (req, res) => {
  const { id } = req.params;
  const {
    rows: [product],
  } = await db.query("SELECT * FROM products WHERE id=$1", [id]);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

app.get("/products/:id/orders", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    rows: [product],
  } = await db.query("SELECT * FROM products WHERE id=$1", [id]);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const { rows } = await db.query(
    `
    SELECT o.* FROM orders o
    JOIN order_products op ON o.id = op.order_id
    WHERE op.product_id=$1 AND o.user_id=$2
  `,
    [id, req.user.id]
  );

  res.json(rows);
});

app.post("/orders", authenticateToken, async (req, res) => {
  const { date, note } = req.body;
  if (!date) return res.status(400).json({ error: "Missing date" });

  const {
    rows: [order],
  } = await db.query(
    "INSERT INTO orders (date, note, user_id) VALUES ($1, $2, $3) RETURNING *",
    [date, note || "", req.user.id]
  );

  res.status(201).json(order);
});

app.get("/orders", authenticateToken, async (req, res) => {
  const { rows } = await db.query("SELECT * FROM orders WHERE user_id=$1", [
    req.user.id,
  ]);
  res.json(rows);
});

app.get("/orders/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    rows: [order],
  } = await db.query("SELECT * FROM orders WHERE id=$1", [id]);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.user_id !== req.user.id)
    return res.status(403).json({ error: "Forbidden" });
  res.json(order);
});

app.post("/orders/:id/products", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { productId, quantity } = req.body;
  if (!productId || !quantity)
    return res.status(400).json({ error: "Missing productId or quantity" });

  const {
    rows: [order],
  } = await db.query("SELECT * FROM orders WHERE id=$1", [id]);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.user_id !== req.user.id)
    return res.status(403).json({ error: "Forbidden" });

  const {
    rows: [product],
  } = await db.query("SELECT * FROM products WHERE id=$1", [productId]);
  if (!product)
    return res.status(400).json({ error: "Product does not exist" });

  const {
    rows: [orderProduct],
  } = await db.query(
    "INSERT INTO order_products (order_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *",
    [id, productId, quantity]
  );

  res.status(201).json(orderProduct);
});

app.get("/orders/:id/products", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    rows: [order],
  } = await db.query("SELECT * FROM orders WHERE id=$1", [id]);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.user_id !== req.user.id)
    return res.status(403).json({ error: "Forbidden" });

  const { rows } = await db.query(
    `
    SELECT p.* FROM products p
    JOIN order_products op ON p.id = op.product_id
    WHERE op.order_id=$1
  `,
    [id]
  );

  res.json(rows);
});

app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

try {
  await db.connect();
  console.log("🌱 Database connected.");

  app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}...`);
  });
} catch (err) {
  console.error("❌ Failed to connect to database:", err);
  process.exit(1);
}

process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  await db.end();
  process.exit();
});
process.on("SIGTERM", async () => {
  console.log("\nShutting down...");
  await db.end();
  process.exit();
});
