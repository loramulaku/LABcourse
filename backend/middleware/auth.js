//kontrollon tokenin
console.log('REFRESH_SECRET:', process.env.REFRESH_SECRET);

const jwt = require('jsonwebtoken');

// kontrollo nëse token është valid
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Nuk ka token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token i pavlefshëm" });
    req.user = user; // ruajmë userin brenda req
    next();
  });
}

// kontrollo nëse është admin
function isAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Vetëm admin ka qasje" });
  }
  next();
}

module.exports = { authenticateToken, isAdmin };
