const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");

const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const analyzeRoutes = require("./routes/analyze");

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/mindcheck", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// View engine and static
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session
app.use(
  session({
    secret: "mindcheck_secret_key_change_me",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 3 }, // 3 hours
  })
);

// Make session user available to views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.toast = req.session.toast || null;
  delete req.session.toast;
  next();
});

// Routes
app.get("/", (req, res) => {
  res.render("login"); // homepage -> login
});
app.use("/", authRoutes);
app.use("/", dashboardRoutes);
app.use("/", analyzeRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
