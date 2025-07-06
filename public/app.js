document.addEventListener('DOMContentLoaded', () => {
  // Theme toggle
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeIcon(newTheme);
    });

    // Check saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }

  function updateThemeIcon(theme) {
    const icon = document.querySelector('.theme-toggle i');
    if (icon) {
      icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  // Mobile menu
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('active');
    });
  }

  // Navigation
  setupNavigation();

  // Load initial page
  loadPage(window.location.hash || '#home');
});

function setupNavigation() {
  // Page links
  document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = e.target.getAttribute('data-page');
      window.location.hash = page;
      loadPage(`#${page}`);
      
      // Close mobile menu if open
      const mobileMenu = document.querySelector('.mobile-menu');
      if (mobileMenu) mobileMenu.classList.remove('active');
    });
  });

  // Handle hash changes
  window.addEventListener('hashchange', () => {
    loadPage(window.location.hash);
  });
}

async function loadPage(hash) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.add('hidden');
  });

  // Show loading state if needed
  // ...

  // Determine which page to show
  let pageId = 'home-page';
  if (hash) {
    switch (hash) {
      case '#explore':
        pageId = 'explore-page';
        await loadExplorePage();
        break;
      case '#profile':
        pageId = 'profile-page';
        await loadProfilePage();
        break;
      case '#home':
      default:
        pageId = 'home-page';
        await loadHomePage();
        break;
    }
  }

  // Show the selected page
  const page = document.getElementById(pageId);
  if (page) {
    page.classList.remove('hidden');
  }

  // Handle post page
  if (hash.startsWith('#post=')) {
    const postId = hash.split('=')[1];
    await loadPostPage(postId);
    document.getElementById('post-page').classList.remove('hidden');
  }

  // Handle create post
  if (hash === '#create-post') {
    document.getElementById('create-post-page').classList.remove('hidden');
    setupCreatePostForm();
  }
}

async function loadHomePage() {
  try {
    const response = await fetch('/api/posts');
    if (!response.ok) throw new Error('Failed to load posts');
    
    const data = await response.json();
    renderPosts(data.posts, 'posts-container');
    
    // Set up create post button if logged in
    const createPostBtn = document.getElementById('hero-cta');
    if (createPostBtn) {
      createPostBtn.addEventListener('click', () => {
        if (auth.currentUser) {
          window.location.hash = 'create-post';
        } else {
          document.getElementById('login-modal').classList.add('active');
        }
      });
    }
  } catch (error) {
    console.error('Error loading home page:', error);
    alert('Failed to load posts. Please try again later.');
  }
}

async function loadExplorePage() {
  try {
    const response = await fetch('/api/posts');
    if (!response.ok) throw new Error('Failed to load posts');
    
    const data = await response.json();
    renderPosts(data.posts, 'explore-posts');
    
    // Set up search and filter
    const searchInput = document.getElementById('search-posts');
    const filterSelect = document.getElementById('filter-category');
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filterPosts(e.target.value, filterSelect.value);
      });
    }
    
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        filterPosts(searchInput.value, e.target.value);
      });
    }
  } catch (error) {
    console.error('Error loading explore page:', error);
    alert('Failed to load posts. Please try again later.');
  }
}

function filterPosts(searchTerm, category) {
  const postsContainer = document.getElementById('explore-posts');
  const posts = Array.from(postsContainer.children);
  
  posts.forEach(post => {
    const title = post.querySelector('.post-title').textContent.toLowerCase();
    const excerpt = post.querySelector('.post-excerpt').textContent.toLowerCase();
    const postCategory = post.dataset.category || 'all';
    
    const matchesSearch = title.includes(searchTerm.toLowerCase()) || 
                         excerpt.includes(searchTerm.toLowerCase());
    const matchesCategory = category === 'all' || postCategory === category;
    
    if (matchesSearch && matchesCategory) {
      post.style.display = 'block';
    } else {
      post.style.display = 'none';
    }
  });
}

async function loadProfilePage() {
  if (!auth.currentUser) {
    window.location.hash = 'home';
    document.getElementById('login-modal').classList.add('active');
    return;
  }

  try {
    // Load user posts
    const response = await fetch('/api/posts');
    if (!response.ok) throw new Error('Failed to load posts');
    
    const data = await response.json();
    const userPosts = data.posts.filter(post => post.authorId === auth.currentUser.id);
    
    renderPosts(userPosts, 'user-posts');
    
    // Set up profile stats
    document.getElementById('profile-posts-count').textContent = `${userPosts.length} Karya`;
    document.getElementById('profile-followers-count').textContent = `${auth.currentUser.followers ? auth.currentUser.followers.length : 0} Pengikut`;
    
    // Set up tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
        document.getElementById(btn.dataset.tab).classList.add('active');
      });
    });
    
    // Set up create post button
    const createPostBtn = document.getElementById('create-post-btn');
    if (createPostBtn) {
      createPostBtn.addEventListener('click', () => {
        window.location.hash = 'create-post';
      });
    }
  } catch (error) {
    console.error('Error loading profile page:', error);
    alert('Failed to load profile data. Please try again later.');
  }
}

async function loadPostPage(postId) {
  try {
    const response = await fetch(`/api/posts/${postId}`);
    if (!response.ok) throw new Error('Failed to load post');
    
    const data = await response.json();
    renderPostDetail(data.post);
    
    // Set up comment form if logged in
    const commentForm = document.getElementById('add-comment-form');
    if (commentForm) {
      if (auth.currentUser) {
        commentForm.classList.remove('hidden');
        commentForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const content = document.getElementById('comment-content').value;
          
          try {
            const response = await fetch(`/api/posts/${postId}/comment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: auth.currentUser.id,
                content
              }),
            });
            
            if (!response.ok) throw new Error('Failed to add comment');
            
            const data = await response.json();
            renderPostDetail(data.post);
            document.getElementById('comment-content').value = '';
          } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment. Please try again.');
          }
        });
      } else {
        commentForm.classList.add('hidden');
      }
    }
  } catch (error) {
    console.error('Error loading post:', error);
    alert('Failed to load post. Please try again later.');
    window.location.hash = 'home';
  }
}

function setupCreatePostForm() {
  const form = document.getElementById('create-post-form');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      alert('Please login to create a post');
      document.getElementById('login-modal').classList.add('active');
      return;
    }
    
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const category = document.getElementById('post-category').value;
    
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          authorId: auth.currentUser.id,
          category
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create post');
      
      const data = await response.json();
      window.location.hash = `post=${data.post.id}`;
      form.reset();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    }
  });
}

function renderPosts(posts, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  
  if (posts.length === 0) {
    container.innerHTML = '<p>Belum ada karya yang tersedia.</p>';
    return;
  }
  
  posts.forEach(post => {
    const postElement = document.createElement('div');
    postElement.className = 'post-card';
    postElement.dataset.category = post.category || 'all';
    
    postElement.innerHTML = `
      <div class="post-content">
        <h3 class="post-title">${post.title}</h3>
        <p class="post-excerpt">${post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content}</p>
        <div class="post-meta">
          <div class="post-author">
            <img src="icons/user-default.png" alt="Author">
            <span>${post.authorName || 'Anonymous'}</span>
          </div>
          <div class="post-actions">
            <button data-action="like" data-post-id="${post.id}">
              <i class="fas fa-heart"></i> ${post.likes ? post.likes.length : 0}
            </button>
            <button data-action="comment" data-post-id="${post.id}">
              <i class="fas fa-comment"></i> ${post.comments ? post.comments.length : 0}
            </button>
          </div>
        </div>
      </div>
    `;
    
    container.appendChild(postElement);
  });
  
  // Set up post actions
  document.querySelectorAll('[data-action="like"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if (!auth.currentUser) {
        document.getElementById('login-modal').classList.add('active');
        return;
      }
      
      const postId = e.currentTarget.dataset.postId;
      
      try {
        const response = await fetch(`/api/posts/${postId}/like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: auth.currentUser.id
          }),
        });
        
        if (!response.ok) throw new Error('Failed to like post');
        
        const data = await response.json();
        updatePostLikes(postId, data.post.likes ? data.post.likes.length : 0);
      } catch (error) {
        console.error('Error liking post:', error);
        alert('Failed to like post. Please try again.');
      }
    });
  });
  
  document.querySelectorAll('[data-action="comment"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const postId = e.currentTarget.dataset.postId;
      window.location.hash = `post=${postId}`;
    });
  });
  
  document.querySelectorAll('.post-title, .post-excerpt').forEach(el => {
    el.addEventListener('click', (e) => {
      const postCard = e.currentTarget.closest('.post-card');
      if (postCard) {
        const postId = postCard.querySelector('[data-action="like"]').dataset.postId;
        window.location.hash = `post=${postId}`;
      }
    });
  });
}

function updatePostLikes(postId, likeCount) {
  document.querySelectorAll(`[data-post-id="${postId}"]`).forEach(btn => {
    const icon = btn.querySelector('i');
    if (icon) {
      btn.innerHTML = `<i class="fas fa-heart"></i> ${likeCount}`;
    }
  });
}

function renderPostDetail(post) {
  const container = document.getElementById('post-detail');
  if (!container) return;
  
  container.innerHTML = `
    <h2 class="post-detail-title">${post.title}</h2>
    <div class="post-detail-meta">
      <div class="post-detail-author">
        <img src="icons/user-default.png" alt="Author">
        <div>
          <h4>${post.authorName || 'Anonymous'}</h4>
          <span class="post-date">${new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div class="post-detail-stats">
        <span><i class="fas fa-eye"></i> ${post.views || 0}</span>
        <span><i class="fas fa-heart"></i> ${post.likes ? post.likes.length : 0}</span>
        <span><i class="fas fa-comment"></i> ${post.comments ? post.comments.length : 0}</span>
      </div>
    </div>
    <div class="post-detail-content">${post.content}</div>
    <div class="post-detail-actions">
      <button id="like-post-btn" class="btn btn-outline">
        <i class="fas fa-heart"></i> Suka
      </button>
      <button id="share-post-btn" class="btn btn-outline">
        <i class="fas fa-share"></i> Bagikan
      </button>
      ${post.authorId === auth.currentUser?.id ? `
      <button id="edit-post-btn" class="btn btn-outline">
        <i class="fas fa-edit"></i> Edit
      </button>
      ` : ''}
    </div>
  `;
  
  // Set up like button
  const likeBtn = document.getElementById('like-post-btn');
  if (likeBtn) {
    likeBtn.addEventListener('click', async () => {
      if (!auth.currentUser) {
        document.getElementById('login-modal').classList.add('active');
        return;
      }
      
      try {
        const response = await fetch(`/api/posts/${post.id}/like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: auth.currentUser.id
          }),
        });
        
        if (!response.ok) throw new Error('Failed to like post');
        
        const data = await response.json();
        updatePostDetailLikes(data.post.likes ? data.post.likes.length : 0);
      } catch (error) {
        console.error('Error liking post:', error);
        alert('Failed to like post. Please try again.');
      }
    });
  }
  
  // Set up share button
  const shareBtn = document.getElementById('share-post-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const url = `${window.location.origin}${window.location.pathname}#post=${post.id}`;
      navigator.clipboard.writeText(url).then(() => {
        alert('Link berhasil disalin!');
      }).catch(() => {
        prompt('Salin link berikut:', url);
      });
    });
  }
  
  // Render comments
  const commentsList = document.getElementById('comments-list');
  if (commentsList) {
    commentsList.innerHTML = '';
    
    if (post.comments && post.comments.length > 0) {
      post.comments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.innerHTML = `
          <div class="comment-avatar">
            <img src="icons/user-default.png" alt="Commenter">
          </div>
          <div class="comment-content">
            <h4 class="comment-author">${comment.userName}</h4>
            <span class="comment-date">${new Date(comment.createdAt).toLocaleString()}</span>
            <p class="comment-text">${comment.content}</p>
          </div>
        `;
        commentsList.appendChild(commentElement);
      });
    } else {
      commentsList.innerHTML = '<p>Belum ada komentar.</p>';
    }
  }
}

function updatePostDetailLikes(likeCount) {
  const likeStats = document.querySelector('.post-detail-stats span:nth-child(2)');
  if (likeStats) {
    likeStats.innerHTML = `<i class="fas fa-heart"></i> ${likeCount}`;
  }
  
  const likeBtn = document.getElementById('like-post-btn');
  if (likeBtn) {
    likeBtn.innerHTML = `<i class="fas fa-heart"></i> ${likeBtn.textContent.includes('Suka') ? 'Tidak Suka' : 'Suka'}`;
  }
}