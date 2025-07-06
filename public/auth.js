class Auth {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  async init() {
    // Check for existing session
    await this.checkSession();
    this.setupEventListeners();
  }

  async checkSession() {
    const token = this.getCookie('authToken');
    if (token) {
      try {
        const response = await fetch('/api/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          const data = await response.json();
          this.currentUser = data.user;
          this.updateUI();
        } else {
          this.clearSession();
        }
      } catch (error) {
        console.error('Session check failed:', error);
        this.clearSession();
      }
    }
  }

  async login(email, password) {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      this.currentUser = data.user;
      this.updateUI();
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(name, email, password) {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  logout() {
    this.clearSession();
    this.currentUser = null;
    this.updateUI();
    window.location.href = '/';
  }

  clearSession() {
    document.cookie = 'authToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }

  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  updateUI() {
    const authButtons = document.querySelectorAll('.auth-buttons');
    const userMenus = document.querySelectorAll('.user-menu');
    
    if (this.currentUser) {
      authButtons.forEach(btn => btn.classList.add('hidden'));
      userMenus.forEach(menu => menu.classList.remove('hidden'));
      
      // Update user info
      document.querySelectorAll('#user-avatar, #profile-avatar').forEach(img => {
        img.src = 'icons/user-default.png';
      });
      document.querySelectorAll('#profile-name').forEach(el => {
        if (el) el.textContent = this.currentUser.name;
      });
      document.querySelectorAll('#profile-email').forEach(el => {
        if (el) el.textContent = this.currentUser.email;
      });
    } else {
      authButtons.forEach(btn => btn.classList.remove('hidden'));
      userMenus.forEach(menu => menu.classList.add('hidden'));
    }
  }

  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
          await this.login(email, password);
          document.getElementById('login-modal').classList.remove('active');
          loginForm.reset();
        } catch (error) {
          alert(error.message);
        }
      });
    }

    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        try {
          await this.register(name, email, password);
          document.getElementById('register-modal').classList.remove('active');
          registerForm.reset();
          alert('Registration successful! Please login.');
        } catch (error) {
          alert(error.message);
        }
      });
    }

    // Logout buttons
    document.querySelectorAll('#logout-btn, #mobile-logout-btn').forEach(btn => {
      if (btn) btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    });

    // Login/register buttons
    document.querySelectorAll('#login-btn, #mobile-login-btn').forEach(btn => {
      if (btn) btn.addEventListener('click', () => {
        document.getElementById('login-modal').classList.add('active');
      });
    });

    document.querySelectorAll('#register-btn, #mobile-register-btn').forEach(btn => {
      if (btn) btn.addEventListener('click', () => {
        document.getElementById('register-modal').classList.add('active');
      });
    });

    // Close modals
    document.querySelectorAll('.modal .close').forEach(btn => {
      if (btn) btn.addEventListener('click', () => {
        btn.closest('.modal').classList.remove('active');
      });
    });

    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
      if (modal) modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });
  }
}

// Initialize auth
const auth = new Auth();