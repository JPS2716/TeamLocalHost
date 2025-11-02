const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const User = require("../models/User");

// GET /signup
router.get("/signup", (req, res) => {
  res.render("signup");
});

// POST /signup
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    req.session.toast = { type: "danger", message: "Please fill all fields" };
    return res.redirect("/signup");
  }
  try {
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      req.session.toast = {
        type: "danger",
        message: "Username or email already exists",
      };
      return res.redirect("/signup");
    }
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hash });
    await user.save();
    req.session.user = { id: user._id, username: user.username };
    req.session.toast = { type: "success", message: "Signup successful" };
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    req.session.toast = { type: "danger", message: "Server error" };
    res.redirect("/signup");
  }
});

// GET /login
router.get("/login", (req, res) => {
  res.render("login");
});

// POST /login
router.post("/login", async (req, res) => {
  const { usernameOrEmail, password } = req.body;
  if (!usernameOrEmail || !password) {
    req.session.toast = { type: "danger", message: "Please fill all fields" };
    return res.redirect("/login");
  }
  try {
    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    });
    if (!user) {
      req.session.toast = { type: "danger", message: "Invalid credentials" };
      return res.redirect("/login");
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      req.session.toast = { type: "danger", message: "Invalid credentials" };
      return res.redirect("/login");
    }
    req.session.user = { id: user._id, username: user.username };
    req.session.toast = { type: "success", message: "Login successful" };
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    req.session.toast = { type: "danger", message: "Server error" };
    res.redirect("/login");
  }
});

// GET /logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

module.exports = router;
