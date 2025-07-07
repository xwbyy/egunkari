document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const authButton = document.getElementById('auth-button');
  const authModal = document.getElementById('auth-modal');
  const closeModalButtons = document.querySelectorAll('.close-modal');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginTab = document.querySelector('[data-tab="login"]');
  const registerTab = document.querySelector('[data-tab="register"]');
  const themeToggle = document.getElementById('theme-toggle');
  const createPostBtn = document.getElementById('create-post-btn');
  const createPostModal = document.getElementById('create-post-modal');
  const postForm = document.getElementById('post-form');
  const navLinks = document.querySelectorAll('.nav-link');
  const pages = document.querySelectorAll('.page');
  const backBtn = document.getElementById('back-btn');
  const commentForm = document.getElementById('comment-form');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const followBtn = document.getElementById('follow-btn');
  
  // State
  let currentUser = null;
  let currentPostId = null;
  let currentProfileUsername = null;
  
  // Initialize
  checkAuth();
  loadPosts();
  setupEventListeners();
  
  // Functions
  function setupEventListeners() {
    // Auth modal
    authButton.addEventListener('click', toggleAuthModal);
    closeModalButtons.forEach(btn => btn.addEventListener('click', closeAllModals));
    
    // Auth tabs
    loginTab.addEventListener('click', () => switchAuthTab('login'));
    registerTab.addEventListener('click', () => switchAuthTab('register'));
    
    // Forms
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    postForm.addEventListener('submit', handlePostSubmit);
    commentForm && commentForm.addEventListener('submit', handleCommentSubmit);
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Navigation
    createPostBtn && createPostBtn.addEventListener('click', () => createPostModal.classList.add('active'));
    navLinks.forEach(link => link.addEventListener('click', handleNavClick));
    backBtn && backBtn.addEventListener('click', goBack);
    
    // Profile tabs
    tabButtons.forEach(btn => btn.addEventListener('click', handleTabClick));
    
    // Follow button
    followBtn && followBtn.addEventListener('click', handleFollow);
  }
  
  function checkAuth() {
    const token = getCookie('token');
    if (token) {
      fetch('/api/user')
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            currentUser = data;
            updateAuthUI(true);
          } else {
            updateAuthUI(false);
          }
        })
        .catch(() => updateAuthUI(false));
    } else {
      updateAuthUI(false);
    }
  }
  
  function updateAuthUI(isAuthenticated) {
    if (isAuthenticated) {
      authButton.textContent = 'Keluar';
      authButton.onclick = handleLogout;
      
      // Update nav links
      document.querySelector('[data-page="profile"]').textContent = currentUser.username;
    } else {
      authButton.textContent = 'Masuk';
      authButton.onclick = toggleAuthModal;
    }
  }
  
  function toggleAuthModal() {
    authModal.classList.toggle('active');
  }
  
  function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('active'));
  }
  
  function switchAuthTab(tab) {
    if (tab === 'login') {
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
      loginTab.classList.add('active');
      registerTab.classList.remove('active');
    } else {
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
      loginTab.classList.remove('active');
      registerTab.classList.add('active');
    }
  }
  
  function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        currentUser = data.user;
        updateAuthUI(true);
        closeAllModals();
        loadPosts();
      } else {
        alert(data.error || 'Login failed');
      }
    })
    .catch(err => {
      console.error(err);
      alert('Login failed');
    });
  }
  
  function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        currentUser = data.user;
        updateAuthUI(true);
        closeAllModals();
        loadPosts();
      } else {
        alert(data.error || 'Registration failed');
      }
    })
    .catch(err => {
      console.error(err);
      alert('Registration failed');
    });
  }
  
  function handleLogout() {
    fetch('/api/logout', {
      method: 'POST'
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        currentUser = null;
        updateAuthUI(false);
        loadPosts();
      }
    })
    .catch(err => {
      console.error(err);
    });
  }
  
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  }
  
  function loadPosts() {
    fetch('/api/posts')
      .then(res => res.json())
      .then(posts => {
        renderPosts(posts, 'posts-list');
        
        if (document.getElementById('explore-posts')) {
          renderPosts(posts, 'explore-posts');
        }
      })
      .catch(err => console.error(err));
  }
  
  function renderPosts(posts, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (posts.length === 0) {
      container.innerHTML = '<p>Belum ada tulisan.</p>';
      return;
    }
    
    posts.forEach(post => {
      const postEl = document.createElement('div');
      postEl.className = 'post-card';
      postEl.innerHTML = `
        <div class="post-content">
          <h3 class="post-title">${post.title}</h3>
          <p class="post-excerpt">${post.content.substring(0, 150)}${post.content.length > 150 ? '...' : ''}</p>
          <div class="post-tags">
            ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
          <div class="post-meta">
            <span class="post-author">${post.author}</span>
            <div class="post-stats">
              <span class="post-stat"><i class="far fa-eye"></i> ${post.views}</span>
              <span class="post-stat"><i class="far fa-heart"></i> ${post.likes.length}</span>
              <span class="post-stat"><i class="far fa-comment"></i> ${post.comments.length}</span>
            </div>
          </div>
        </div>
      `;
      
      postEl.addEventListener('click', () => viewPost(post.id));
      container.appendChild(postEl);
    });
  }
  
  function handlePostSubmit(e) {
    e.preventDefault();
    if (!currentUser) return;
    
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const tags = document.getElementById('post-tags').value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag);
    
    fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, content, tags })
    })
    .then(res => res.json())
    .then(post => {
      closeAllModals();
      postForm.reset();
      loadPosts();
      showPage('home');
    })
    .catch(err => console.error(err));
  }
  
  function viewPost(postId) {
    fetch(`/api/posts/${postId}`)
      .then(res => res.json())
      .then(post => {
        currentPostId = post.id;
        
        const postDetail = document.getElementById('post-detail');
        postDetail.innerHTML = `
          <h1 class="post-detail-title">${post.title}</h1>
          <div class="post-detail-author">
            <span>Ditulis oleh ${post.author}</span>
          </div>
          <div class="post-detail-content">${post.content}</div>
          <div class="post-tags">
            ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
          <div class="post-detail-meta">
            <div class="post-actions">
              <button class="${post.likes.includes(currentUser?.email) ? 'liked' : ''}" 
                onclick="handleLike('${post.id}')">
                <i class="${post.likes.includes(currentUser?.email) ? 'fas' : 'far'} fa-heart"></i> 
                ${post.likes.length} Suka
              </button>
              <button onclick="sharePost('${post.id}', '${post.title}')">
                <i class="fas fa-share"></i> Bagikan
              </button>
            </div>
            <span>${new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
        `;
        
        // Render comments
        const commentsList = document.getElementById('comments-list');
        commentsList.innerHTML = '';
        
        if (post.comments.length === 0) {
          commentsList.innerHTML = '<p>Belum ada komentar.</p>';
        } else {
          post.comments.forEach(comment => {
            const commentEl = document.createElement('div');
            commentEl.className = 'comment';
            commentEl.innerHTML = `
              <div class="comment-author">${comment.author}</div>
              <div class="comment-text">${comment.text}</div>
              <div class="comment-meta">${new Date(comment.createdAt).toLocaleString()}</div>
            `;
            commentsList.appendChild(commentEl);
          });
        }
        
        showPage('post');
      })
      .catch(err => console.error(err));
  }
  
  function handleCommentSubmit(e) {
    e.preventDefault();
    if (!currentUser) return;
    
    const text = document.getElementById('comment-text').value;
    
    fetch(`/api/posts/${currentPostId}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    })
    .then(res => res.json())
    .then(comment => {
      document.getElementById('comment-text').value = '';
      viewPost(currentPostId);
    })
    .catch(err => console.error(err));
  }
  
  function handleLike(postId) {
    if (!currentUser) {
      toggleAuthModal();
      return;
    }
    
    fetch(`/api/posts/${postId}/like`, {
      method: 'PUT'
    })
    .then(res => res.json())
    .then(data => {
      viewPost(postId);
    })
    .catch(err => console.error(err));
  }
  
  function sharePost(postId, title) {
    if (navigator.share) {
      navigator.share({
        title: title,
        text: 'Baca tulisan ini di Egunkari',
        url: `${window.location.origin}/post/${postId}`
      })
      .catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback for browsers that don't support Web Share API
      const url = `${window.location.origin}/post/${postId}`;
      const tempInput = document.createElement('input');
      document.body.appendChild(tempInput);
      tempInput.value = url;
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      alert('Link telah disalin ke clipboard!');
    }
  }
  
  function handleNavClick(e) {
    e.preventDefault();
    const page = e.target.getAttribute('data-page');
    showPage(page);
    
    if (page === 'profile') {
      loadProfile(currentUser.username);
    }
  }
  
  function showPage(pageName) {
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(`${pageName}-page`).classList.add('active');
    
    if (pageName === 'profile' && currentProfileUsername) {
      loadProfile(currentProfileUsername);
    }
  }
  
  function goBack() {
    showPage('home');
  }
  
  function loadProfile(username) {
    currentProfileUsername = username;
    
    fetch('/api/posts')
      .then(res => res.json())
      .then(posts => {
        const userPosts = posts.filter(post => post.author === username);
        const likedPosts = posts.filter(post => post.likes.includes(currentUser?.email));
        
        // Render profile header
        const profileUser = userPosts.length > 0 ? userPosts[0] : { author: username };
        
        document.getElementById('profile-username').textContent = profileUser.author;
        document.getElementById('profile-email').textContent = profileUser.authorEmail || '';
        document.getElementById('profile-posts-count').textContent = `${userPosts.length} Tulisan`;
        
        // For now, we'll just show counts - in a real app, you'd fetch user data
        document.getElementById('profile-followers').textContent = '0 Pengikut';
        document.getElementById('profile-following').textContent = '0 Mengikuti';
        
        // Update follow button
        if (currentUser && currentUser.username !== username) {
          followBtn.style.display = 'block';
          // In a real app, you'd check if current user is following this user
          followBtn.textContent = 'Ikuti';
        } else {
          followBtn.style.display = 'none';
        }
        
        // Render posts
        renderPosts(userPosts, 'user-posts');
        renderPosts(likedPosts, 'liked-posts');
      })
      .catch(err => console.error(err));
  }
  
  function handleTabClick(e) {
    const tab = e.target.getAttribute('data-tab');
    
    // Update tab buttons
    tabButtons.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    // Update tab contents
    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(tab).classList.add('active');
  }
  
  function handleFollow() {
    if (!currentUser) {
      toggleAuthModal();
      return;
    }
    
    fetch(`/api/users/${currentProfileUsername}/follow`, {
      method: 'PUT'
    })
    .then(res => res.json())
    .then(data => {
      // Update UI
      document.getElementById('profile-followers').textContent = `${data.followers.length} Pengikut`;
      followBtn.textContent = data.followers.includes(currentUser.username) ? 'Berhenti Mengikuti' : 'Ikuti';
    })
    .catch(err => console.error(err));
  }
  
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }
  
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Expose functions to global scope for inline event handlers
  window.handleLike = handleLike;
  window.sharePost = sharePost;
});

// Handle direct post links
window.addEventListener('load', function() {
  const path = window.location.pathname;
  if (path.startsWith('/post/')) {
    const postId = path.split('/')[2];
    document.querySelector('[data-page="post"]').viewPost(postId);
  }
});