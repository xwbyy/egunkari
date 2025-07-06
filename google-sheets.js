const { google } = require('googleapis');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Konfigurasi
const spreadsheetId = '1OTwKWXNhj1a0A74kKDz5jSjvaoSWyCESQIbGGDyRYfM';
const sheetName = 'egunkari';
const timezone = 'Asia/Jakarta';
const JWT_SECRET = 'egunkari_secret_key';

// Autentikasi Google Sheets
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: "service_account",
    project_id: "daniel136",
    private_key_id: "96b25ab3b1d870db38cd9d5d17ab93a38b423eee",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCrMnVriT5nJWyO\nTEP83ZZ320cPc+gjpCktB2m5C7nckfbvvPGd0qjY5hEXztB98rzfKNKZD3aFI0y4\nBwRo4w1IzFUSkymfrO1JL4UeOUe+nQv02BL7UyEXD7E4/fLGSEPRfbo3ScsCBMo2\noIXzvYGIZJfB5I0WXgIODtALXaerytL1ngOEDaurIsuSqdFJ8T40Te+20Tymrygu\nHt7ymAnxKuin9rcVN5AfVBhywVDX+ERMipTCdYT+YOZX5DOKYu+96vB7uyTvPKPd\n58EwtwPRGSqduu7EwVUJhIvuUQaveHppWEW7jTY1cO2603Yl1BefoNIt1dBb7LbF\n49qdOFE7AgMBAAECggEAEAxVXITLkEC+WeKFVw1wnwCzuxua7chkQb/ZpcqXHDmk\no9ma7rgCMv7yKECvY7cfBG5fu5BrBFUISpIB1FFAfAwHh4u7EahUwBEP0gL9mj0/\nky60LNIgnnhOnTCVEwhQLzGxhKBKwwAu8or+s5gWrfH8FeV2Ylvipm22C/K2FpDv\n64wyKeFT5sFmAdoZORu0Y/7NRQ9Eyhk4fOg8N03ktAu/WOW1YSt8KkQAQIHd6YIg\nfyKYsUe9k7DiHT1DZ7QwPAnfxnB2bWkxnRlf/8/Mor5rs7K8iHarFdv3nPjiTVH/\nYDp+q8SECiyiltYfvdI0D97nFOqtOK7OmtA70LmgwQKBgQDkK0VJQl/IpPgZwrhm\n36eXiwJ6t2T4ThJ3B+5RxBZ7h9agU3nTUfBlD/OsBg2bu3q36Szv3YOTxvTepR8Z\n5oMdpV2LnHfwymKirpk30sBEnDeBo2pVCHM+XjcbcbexSgRd1aAqHFaTkRh59EnC\nsPVOFyBZP2CApCckSlzeQs5QQQKBgQDAFDOx5ga8ic+ScfOpqWZnRddVFZGmvBP9\nYRS7SbZKGI3Kqv4Y1a5UTY/yj2h/EgeUi2gm86L2bZhAB/guf1NlKTHqSV2Lcq+q\ntQwcRF2x6XonZljXcMpeEdRY7MEIoazWVS2EeUPaTiTKjfuU/3zuEyO81yIR1/tF\n3frCuadCewKBgQDeoiYSDJS/h9CZ+jjKEFNL+BSsPwRjkHJN+MwetnGliW7vs2P8\nwUgKpJ0D7kga+70LdJcnWYJIkGpgUMffEuA+7hsv3bXemuvRhwHzyU1X5QH4Gcbo\nP72LTo0A114AvJM0J/0G+e20QXCblrTeJqLE1qX2z3NPMl0K+RBSwubiwQKBgCYB\nGUVetQCC5+4a29I68UcHu5ZbISlzVyUwGzD/YbEBcLSj5oi1ZrvJaOzeURerUpKi\njqX+WMUXZCNvMDzK9o4ye2zWvUqFE5rcHZxOLpewEXpQNs3RxEiekHxTw9HYY2E5\nEzt93t4HziHBvAB8GJTmdpC7pEMRj+cAB8iVgTGXAoGAPklvxGp56KQdxvEHRk+4\nQBX+g+Hw+tNVqzKVxPPCpOve/2ScOiVr/3PGWMNd2HeIzIWHVfZXWyETkwWiqmtL\n378u2pFNh6FaxZFbFObZjyPKYr/aWSd8fmy0v/NeNDz2+oL4n1D1DNVu6T2D2kQy\nSNW2o4UK3JmkBY25rIKqfC0=\n-----END PRIVATE KEY-----\n",
    client_email: "daniel166@daniel136.iam.gserviceaccount.com",
    client_id: "117950866995283381514",
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Helper functions
async function getSheetData(range) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!${range}`,
  });
  return response.data.values || [];
}

async function appendSheetData(range, values) {
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!${range}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values },
  });
}

async function updateSheetData(range, values) {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!${range}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values },
  });
}

// User functions
async function getUsers() {
  const data = await getSheetData('A2:E');
  return data.map(row => ({
    id: row[0],
    name: row[1],
    email: row[2],
    passwordHash: row[3],
    followers: row[4] ? row[4].split(',') : [],
  }));
}

async function createUser(name, email, password) {
  const users = await getUsers();
  if (users.some(user => user.email === email)) {
    throw new Error('Email already registered');
  }

  const id = uuidv4();
  const passwordHash = await bcrypt.hash(password, 10);
  const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '7d' });

  await appendSheetData('A2:E', [[id, name, email, passwordHash, '']]);

  return { id, name, email, token };
}

async function getUserByEmail(email) {
  const users = await getUsers();
  return users.find(user => user.email === email);
}

async function getUserById(id) {
  const users = await getUsers();
  return users.find(user => user.id === id);
}

async function authenticate(email, password) {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: '7d' });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    followers: user.followers,
    token
  };
}

async function followUser(userId, followerId) {
  const users = await getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  const user = users[userIndex];
  let followers = user.followers || [];
  
  if (followers.includes(followerId)) {
    followers = followers.filter(id => id !== followerId);
  } else {
    followers.push(followerId);
  }

  await updateSheetData(`E${userIndex + 2}`, [[followers.join(',')]]);
  
  return {
    ...user,
    followers
  };
}

// Post functions
async function getPosts() {
  const data = await getSheetData('G2:N');
  return data.map(row => ({
    id: row[0],
    title: row[1],
    content: row[2],
    authorId: row[3],
    createdAt: row[4],
    likes: row[5] ? row[5].split(',') : [],
    comments: row[6] ? JSON.parse(row[6]) : [],
    views: parseInt(row[7] || 0),
  }));
}

async function createPost(title, content, authorId) {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  await appendSheetData('G2:N', [[
    id,
    title,
    content,
    authorId,
    now,
    '',
    '[]',
    0
  ]]);

  return {
    id,
    title,
    content,
    authorId,
    createdAt: now,
    likes: [],
    comments: [],
    views: 0
  };
}

async function getPostById(id) {
  const posts = await getPosts();
  const post = posts.find(p => p.id === id);
  
  if (!post) {
    throw new Error('Post not found');
  }

  // Increment views
  const postIndex = posts.findIndex(p => p.id === id);
  const newViews = post.views + 1;
  await updateSheetData(`N${postIndex + 2}`, [[newViews]]);
  
  return {
    ...post,
    views: newViews
  };
}

async function likePost(postId, userId) {
  const posts = await getPosts();
  const postIndex = posts.findIndex(p => p.id === postId);
  
  if (postIndex === -1) {
    throw new Error('Post not found');
  }

  const post = posts[postIndex];
  let likes = post.likes || [];
  
  if (likes.includes(userId)) {
    likes = likes.filter(id => id !== userId);
  } else {
    likes.push(userId);
  }

  await updateSheetData(`L${postIndex + 2}`, [[likes.join(',')]]);
  
  return {
    ...post,
    likes
  };
}

async function addComment(postId, userId, content) {
  const posts = await getPosts();
  const postIndex = posts.findIndex(p => p.id === postId);
  
  if (postIndex === -1) {
    throw new Error('Post not found');
  }

  const post = posts[postIndex];
  const comments = post.comments || [];
  const user = await getUserById(userId);
  
  comments.push({
    id: uuidv4(),
    userId,
    userName: user.name,
    content,
    createdAt: new Date().toISOString()
  });

  await updateSheetData(`M${postIndex + 2}`, [[JSON.stringify(comments)]]);
  
  return {
    ...post,
    comments
  };
}

module.exports = {
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
};