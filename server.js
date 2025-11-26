// server.js
import express from "express";
import dotenv from "dotenv";
import db from "./db/client.js";

import usersRouter from "./routes/users.js";
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";
import healthRouter from "./routes/health.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

// Middleware
app.use(express.json());

// Routers
app.use("/api/health", healthRouter);
app.use("/api/users", usersRouter);
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);

// 404 Middleware
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error Middleware
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
(async () => {
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
})();

// Graceful shutdown
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
