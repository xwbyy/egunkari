const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { auth } = require('googleapis');
const { 
  authenticate, 
  getUsers, 
  createUser, 
  getUserByEmail, 
  getUserById, 
  createPost, 
  getPosts, 
  getPostById, 
  likePost, 
  addComment, 
  followUser 
} = require('./google-sheets');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// API Routes

// User Registration
app.post('/api/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and password are required' 
      });
    }
    
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }
    
    const user = await createUser(name, email, password);
    res.status(201).json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// User Login
app.post('/api/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    const user = await authenticate(email, password);
    
    // Set cookie
    res.cookie('authToken', user.token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid email or password' 
    });
  }
});

// Get all posts
app.get('/api/posts', async (req, res, next) => {
  try {
    const posts = await getPosts();
    res.json({ success: true, posts });
  } catch (error) {
    next(error);
  }
});

// Create a new post
app.post('/api/posts', async (req, res, next) => {
  try {
    const { content, title, authorId } = req.body;
    if (!content || !title || !authorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Content, title, and authorId are required' 
      });
    }
    
    const post = await createPost(title, content, authorId);
    res.status(201).json({ success: true, post });
  } catch (error) {
    next(error);
  }
});

// Get single post
app.get('/api/posts/:id', async (req, res, next) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }
    res.json({ success: true, post });
  } catch (error) {
    next(error);
  }
});

// Like a post
app.post('/api/posts/:id/like', async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId is required' 
      });
    }
    
    const post = await likePost(req.params.id, userId);
    res.json({ success: true, post });
  } catch (error) {
    next(error);
  }
});

// Add comment to post
app.post('/api/posts/:id/comment', async (req, res, next) => {
  try {
    const { userId, content } = req.body;
    if (!userId || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId and content are required' 
      });
    }
    
    const post = await addComment(req.params.id, userId, content);
    res.json({ success: true, post });
  } catch (error) {
    next(error);
  }
});

// Follow a user
app.post('/api/users/:id/follow', async (req, res, next) => {
  try {
    const { followerId } = req.body;
    if (!followerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'followerId is required' 
      });
    }
    
    if (req.params.id === followerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot follow yourself' 
      });
    }
    
    const user = await followUser(req.params.id, followerId);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// Serve the app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});