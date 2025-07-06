const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { auth } = require('googleapis');
const { authenticate, getUsers, createUser, getUserByEmail, getUserById, createPost, getPosts, getPostById, likePost, addComment, followUser } = require('./google-sheets');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await createUser(name, email, password);
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authenticate(email, password);
    
    // Set cookie
    res.cookie('authToken', user.token, { 
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
});

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await getPosts();
    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { content, title, authorId } = req.body;
    const post = await createPost(title, content, authorId);
    res.json({ success: true, post });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await getPostById(req.params.id);
    res.json({ success: true, post });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await likePost(req.params.id, userId);
    res.json({ success: true, post });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post('/api/posts/:id/comment', async (req, res) => {
  try {
    const { userId, content } = req.body;
    const post = await addComment(req.params.id, userId, content);
    res.json({ success: true, post });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post('/api/users/:id/follow', async (req, res) => {
  try {
    const { followerId } = req.body;
    const user = await followUser(req.params.id, followerId);
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Serve the app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});