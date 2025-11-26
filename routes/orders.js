import { Router } from "express";

import {
  createOrder,
  getOrdersByUser,
  getOrderById,
  addProductToOrder,
  getProductsInOrder,
} from "../db/orders.js";

import { authenticateToken } from "../middleware/Auth.js";

const router = Router();

// Create order
router.post("/", authenticateToken, async (req, res, next) => {
  try {
    const order = await createOrder({ ...req.body, userId: req.user.id });
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// Get all orders of a user
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const orders = await getOrdersByUser(req.user.id);
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// Get specific order
router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.user_id !== req.user.id)
      return res.status(403).json({ error: "Forbidden" });

    res.json(order);
  } catch (err) {
    next(err);
  }
});

// Add product to order
router.post("/:id/products", authenticateToken, async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const orderProduct = await addProductToOrder({
      orderId: req.params.id,
      productId,
      quantity,
    });
    res.status(201).json(orderProduct);
  } catch (err) {
    next(err);
  }
});

// Get products in order
router.get("/:id/products", authenticateToken, async (req, res, next) => {
  try {
    const products = await getProductsInOrder(req.params.id);
    res.json(products);
  } catch (err) {
    next(err);
  }
});

export default router;
