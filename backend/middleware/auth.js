const jwt = require("jsonwebtoken");

// Middleware për verifikimin e access token-it
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: "Nuk ka token, login ose refresh" });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET not set in environment variables");
    return res.status(500).json({ error: "Server configuration error" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token i pavlefshëm ose skadoi" });
    }
    req.user = user; // { id, role }
    next();
  });
}

// Middleware për të kontrolluar nëse user është admin
function isAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Akses i ndaluar, duhet admin" });
  }
  next();
}

module.exports = { authenticateToken, isAdmin };
