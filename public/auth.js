// This file is included in app.js, separated here for organization

/**
 * Google Sheets API functions
 */
async function getUsers() {
  try {
    const response = await fetch('/api/users');
    return await response.json();
  } catch (err) {
    console.error('Error fetching users:', err);
    return [];
  }
}

async function getPosts() {
  try {
    const response = await fetch('/api/posts');
    return await response.json();
  } catch (err) {
    console.error('Error fetching posts:', err);
    return [];
  }
}

async function createPost(postData) {
  try {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });
    return await response.json();
  } catch (err) {
    console.error('Error creating post:', err);
    return null;
  }
}

async function likePost(postId) {
  try {
    const response = await fetch(`/api/posts/${postId}/like`, {
      method: 'PUT'
    });
    return await response.json();
  } catch (err) {
    console.error('Error liking post:', err);
    return null;
  }
}

async function addComment(postId, commentText) {
  try {
    const response = await fetch(`/api/posts/${postId}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: commentText })
    });
    return await response.json();
  } catch (err) {
    console.error('Error adding comment:', err);
    return null;
  }
}

async function followUser(username) {
  try {
    const response = await fetch(`/api/users/${username}/follow`, {
      method: 'PUT'
    });
    return await response.json();
  } catch (err) {
    console.error('Error following user:', err);
    return null;
  }
}