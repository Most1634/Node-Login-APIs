require('dotenv').config();  // Load environment variables from .env file
const express = require('express');
const app = express();
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');

// Middleware
app.use(express.json());  // Parse incoming JSON requests
app.use(cors());          // Enable Cross-Origin Request sharing

// Use routes
app.use('/auth', authRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

