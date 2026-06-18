const router      = require('express').Router();
const authMiddle  = require('../middleware/auth');
const store       = require('../store/inMemory');

// GET /api/shop/products  — public
router.get('/products', (req, res) => {
  res.json(store.products);
});

// POST /api/shop/checkout  — requires JWT
router.post('/checkout', authMiddle, (req, res) => {
  const { productId, quantity } = req.body || {};
  if (!productId || !quantity)
    return res.status(400).json({ error: 'productId and quantity are required' });

  const product = store.products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const order = {
    id:          store.nextOrderId(),
    userId:      req.user.id,
    productId,
    productName: product.name,
    quantity,
    unitPrice:   product.price,
    total:       Math.round(product.price * quantity * 100) / 100,
    createdAt:   new Date().toISOString(),
  };
  store.orders.push(order);

  res.status(201).json(order);
});

module.exports = router;
