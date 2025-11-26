import { Router } from "express";
import {
  getAllProducts,
  getProductById,
  getOrdersForProduct,
  createProduct,
  updateProduct,
} from "../db/products.js";
import { authenticateToken } from "../middleware/Auth.js";

const router = Router();

// Get all products
router.get("/", async (req, res, next) => {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// Get a single product by id
router.get("/:id", async (req, res, next) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// Get orders for a product (authenticated)
router.get("/:id/orders", authenticateToken, async (req, res, next) => {
  try {
    const orders = await getOrdersForProduct(req.params.id, req.user.id);
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// Create a new product
router.post("/", async (req, res, next) => {
  try {
    const product = await createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

// Update a product
router.patch("/:id", async (req, res, next) => {
  try {
    const updated = await updateProduct(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
