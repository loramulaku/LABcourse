// In-memory "database" — replaces a real DB for CI/CD demo purposes.
// Call store.reset() in beforeEach to get a clean slate between tests.
const store = {
  users: new Map(),       // id → { id, name, email, passwordHash, role }
  activeTokens: new Set(), // JWT strings that are currently valid
  resetTokens: new Map(), // resetToken → { userId, expiry }
  orders: [],

  // Static product catalogue — never reset
  products: [
    { id: 1, name: 'Laptop',   price: 999.99, stock: 10 },
    { id: 2, name: 'Mouse',    price:  29.99, stock: 50 },
    { id: 3, name: 'Keyboard', price:  79.99, stock: 30 },
  ],

  _userId:  1,
  _orderId: 1,
  nextUserId()  { return this._userId++; },
  nextOrderId() { return this._orderId++; },

  reset() {
    this.users.clear();
    this.activeTokens.clear();
    this.resetTokens.clear();
    this.orders = [];
    this._userId  = 1;
    this._orderId = 1;
  },
};

module.exports = store;
