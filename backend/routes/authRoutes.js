const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validators');
// We'll pass supabase from server.js
module.exports = (supabase) => {

  // Register new user
  router.post('/register', validateRegister, async (req, res) => {
    try {
      const { email, password, full_name, user_type, phone, company_name } = req.body;

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            email,
            password: hashedPassword,
            full_name,
            user_type,
            phone: phone || null,
            company_name: company_name || null,
            avatar: null
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Create JWT token
      const token = jwt.sign(
        { userId: data.id, email: data.email, user_type: data.user_type },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          user_type: data.user_type,
          avatar: data.avatar
        }
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Login user
  router.post('/login', validateLogin, async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Create JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, user_type: user.user_type },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          user_type: user.user_type,
          avatar: user.avatar
        }
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update user avatar
  router.put('/update-avatar', authenticateToken, async (req, res) => {
    try {
      const { avatar } = req.body;

      const { data, error } = await supabase
        .from('users')
        .update({ avatar })
        .eq('id', req.user.userId)
        .select()
        .single();

      if (error) throw error;

      // Update localStorage on client side
      res.json({
        message: 'Avatar updated successfully',
        user: {
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          user_type: data.user_type,
          avatar: data.avatar
        }
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};