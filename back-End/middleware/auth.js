const jwt = require("jsonwebtoken");

const authMiddleware = (allowedRoles) => (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Aucun token fourni" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!allowedRoles.includes(decoded.role)) {
      return res.status(403).json({ message: "Accès interdit" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token invalide" });
  }
};

module.exports = authMiddleware;