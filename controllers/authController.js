const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to the database');
});

// Register a new user
exports.register = (req, res) => {
  const { name, surname, username, email, password } = req.body;

  // Validate required fields
  if (!name || !surname || !username || !email || !password) {
    return res.status(400).json({ 
      message: 'All fields (name, surname, username, email, password) are required' 
    });
  }

  // Check if email or username already exists
  db.query(
    'SELECT * FROM users WHERE email = ? OR username = ?', 
    [email, username], 
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (result.length > 0) {
        const existingField = result[0].email === email ? 'email' : 'username';
        return res.status(400).json({ message: `This ${existingField} is already in use` });
      }

      // Hash password
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Save the new user with all fields
        db.query(
          'INSERT INTO users (name, surname, username, email, password) VALUES (?, ?, ?, ?, ?)',
          [name, surname, username, email, hashedPassword],
          (err, result) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            res.status(201).json({ 
              message: 'User registered successfully',
              user: {
                id: result.insertId,
                name,
                surname,
                username,
                email
              }
            });
          }
        );
      });
    }
  );
};

// Login user
exports.login = (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare the hashed password
    bcrypt.compare(password, result[0].password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign({ id: result[0].id }, process.env.JWT_SECRET, {
        expiresIn: '1h', // Set token expiry
      });

      res.status(200).json({ message: 'Login successful', token });
    });
  });
};

exports.getProfile = (req, res) => {
  const userId = req.user.id; // This comes from the verifyToken middleware

  db.query(
    'SELECT id, name, surname, username, email FROM users WHERE id = ?',
    [userId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        user: results[0]
      });
    }
  );
};
