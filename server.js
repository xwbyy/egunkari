require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { auth } = require('googleapis');
const { authenticate, readData, writeData } = require('./google-sheets');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'egunkari-secret-key';

// Auth middleware
const authenticateUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// API Routes
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    const authClient = await authenticate();
    const users = await readData(authClient, 'users');
    
    // Check if user exists
    const userExists = users.some(user => user.email === email);
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Add new user
    const newUser = {
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      followers: [],
      following: []
    };
    
    await writeData(authClient, 'users', [newUser]);
    
    // Generate token
    const token = jwt.sign({ email, username }, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({ success: true, user: { username, email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const authClient = await authenticate();
    const users = await readData(authClient, 'users');
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign({ email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({ success: true, user: { username: user.username, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/user', authenticateUser, async (req, res) => {
  try {
    const authClient = await authenticate();
    const users = await readData(authClient, 'users');
    
    const user = users.find(u => u.email === req.user.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't send password back
    const { password, ...userData } = user;
    res.json(userData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/posts', async (req, res) => {
  try {
    const authClient = await authenticate();
    const posts = await readData(authClient, 'posts');
    res.json(posts.reverse()); // Newest first
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    const authClient = await authenticate();
    const posts = await readData(authClient, 'posts');
    const post = posts.find(p => p.id === req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/posts', authenticateUser, async (req, res) => {
  const { title, content, tags } = req.body;
  
  try {
    const authClient = await authenticate();
    const posts = await readData(authClient, 'posts');
    
    const newPost = {
      id: Date.now().toString(),
      title,
      content,
      tags: tags || [],
      author: req.user.username,
      authorEmail: req.user.email,
      createdAt: new Date().toISOString(),
      likes: [],
      comments: [],
      views: 0
    };
    
    await writeData(authClient, 'posts', [...posts, newPost]);
    res.json(newPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/posts/:id/like', authenticateUser, async (req, res) => {
  try {
    const authClient = await authenticate();
    const posts = await readData(authClient, 'posts');
    const postIndex = posts.findIndex(p => p.id === req.params.id);
    
    if (postIndex === -1) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const post = posts[postIndex];
    const likeIndex = post.likes.indexOf(req.user.email);
    
    if (likeIndex === -1) {
      // Add like
      post.likes.push(req.user.email);
    } else {
      // Remove like
      post.likes.splice(likeIndex, 1);
    }
    
    await writeData(authClient, 'posts', posts);
    res.json({ likes: post.likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/posts/:id/comment', authenticateUser, async (req, res) => {
  const { text } = req.body;
  
  try {
    const authClient = await authenticate();
    const posts = await readData(authClient, 'posts');
    const postIndex = posts.findIndex(p => p.id === req.params.id);
    
    if (postIndex === -1) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const newComment = {
      id: Date.now().toString(),
      author: req.user.username,
      authorEmail: req.user.email,
      text,
      createdAt: new Date().toISOString()
    };
    
    posts[postIndex].comments.push(newComment);
    await writeData(authClient, 'posts', posts);
    res.json(newComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/users/:username/follow', authenticateUser, async (req, res) => {
  try {
    const authClient = await authenticate();
    const users = await readData(authClient, 'users');
    
    const currentUserIndex = users.findIndex(u => u.email === req.user.email);
    const targetUserIndex = users.findIndex(u => u.username === req.params.username);
    
    if (currentUserIndex === -1 || targetUserIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const currentUser = users[currentUserIndex];
    const targetUser = users[targetUserIndex];
    
    // Check if already following
    const isFollowing = currentUser.following.includes(targetUser.username);
    
    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(u => u !== targetUser.username);
      targetUser.followers = targetUser.followers.filter(u => u !== currentUser.username);
    } else {
      // Follow
      currentUser.following.push(targetUser.username);
      targetUser.followers.push(currentUser.username);
    }
    
    await writeData(authClient, 'users', users);
    res.json({ 
      followers: targetUser.followers,
      following: currentUser.following 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});