const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({ name, email, password });
    res.status(201).json({
      user,
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      user,
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// GET /api/auth/api-key  -> returns the current user's integration API key
const getApiKey = async (req, res) => {
  res.json({ apiKey: req.user.apiKey });
};

// POST /api/auth/api-key/regenerate -> issues a new API key, invalidating the old one
const regenerateApiKey = async (req, res, next) => {
  try {
    req.user.apiKey = User.generateApiKey();
    await req.user.save();
    res.json({ apiKey: req.user.apiKey });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, getApiKey, regenerateApiKey };
