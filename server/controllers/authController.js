const User = require('../models/User');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


  exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const token = generateToken(user._id);
      res.json({ token });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  

  exports.getUserInfo = async (req, res) => {
    const userId = req.user._id; 
  
    try {
      const user = await User.findById(userId).select('name email'); 
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({ user });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };


exports.savePublicKey = async (req, res) => {
    try {
      const { userId, publicKey } = req.body;
      
      console.log(userId, publicKey);
      if (!publicKey) {
        return res.status(400).json({ error: 'Public key is required' });
      }
      if(!userId){
        return res.status(400).json({ error: 'User ID is required' });
      }

      console.log('Received public key for user:', userId, publicKey);
      
      await User.updateOne(
        { _id: userId },
        { $set: { publicKey } },
        { upsert: true }
      );
      
      res.status(200).json({ message: 'Public key saved' });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Failed to save public key' });
    }
  };
  