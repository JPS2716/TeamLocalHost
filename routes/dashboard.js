const express = require("express");
const router = express.Router();

// Middleware to protect routes
function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  req.session.toast = { type: "warning", message: "Please login first" };
  return res.redirect("/login");
}

// GET /dashboard
router.get("/dashboard", requireAuth, (req, res) => {
  res.render("dashboard", { username: req.session.user.username });
});

module.exports = router;
