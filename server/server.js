const express = require("express");
require("dotenv").config();

const cors = require("cors");

const authRoutes = require("./routers/authRoute");
const aiRoutes = require("./routers/aiRoute");
const connectDB = require("./config/db");

const app = express();

// CORS
// CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);

// Middleware
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);

// Database
connectDB();

// Health check
app.get("/", (req, res) => {
  res.status(200).send("AI Cold Mail Generator API is running");
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    error: "Something went wrong",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});