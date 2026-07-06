const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Requires a valid JWT; attaches req.user
const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

// Attaches req.user if token present, but doesn't block the request otherwise
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch (err) {
      // ignore invalid token for optional auth
    }
  }
  next();
};

// Authenticates external integrations (e.g. n8n) via the "x-api-key" header
// instead of a user JWT. Attaches req.user just like protect().
const apiKeyAuth = async (req, res, next) => {
  const apiKey = req.header("x-api-key");

  if (!apiKey) {
    return res.status(401).json({ message: "Missing x-api-key header" });
  }

  try {
    const user = await User.findOne({ apiKey });
    if (!user) {
      return res.status(401).json({ message: "Invalid API key" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ message: "Error validating API key" });
  }
};

module.exports = { protect, optionalAuth, apiKeyAuth };
