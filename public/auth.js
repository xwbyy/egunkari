// Fungsi untuk menampilkan pesan
function showMessage(elementId, message, isError = true) {
  const element = document.getElementById(elementId);
  element.textContent = message;
  element.style.display = 'block';
  element.className = isError ? 'error-message' : 'success-message';
  setTimeout(() => element.style.display = 'none', 5000);
}

// Fungsi untuk menampilkan loading
function showLoading(show) {
  document.getElementById('loadingIndicator').style.display = show ? 'block' : 'none';
}

// Handle Google login response
function handleCredentialResponse(response) {
  showLoading(true);
  console.log('Google response received:', response);
  
  fetch('/auth/callback', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token: response.credential })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      localStorage.setItem('jwt_token', data.token);
      showMessage('errorMessage', 'Login berhasil! Mengarahkan ke dashboard...', false);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } else {
      showLoading(false);
      showMessage('errorMessage', data.message || 'Login gagal');
    }
  })
  .catch(error => {
    showLoading(false);
    console.error('Login error:', error);
    showMessage('errorMessage', 'Terjadi kesalahan saat login: ' + error.message);
  });
}

// Initialize Google Auth
function initGoogleAuth() {
  // Cek error dari URL
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  if (error) {
    showMessage('errorMessage', decodeURIComponent(error));
  }

  // Jika sudah login, redirect ke dashboard
  if (localStorage.getItem('jwt_token')) {
    window.location.href = '/dashboard';
    return;
  }

  // Setup fallback button
  const fallbackBtn = document.querySelector('.fallback-btn');
  fallbackBtn.addEventListener('click', () => {
    window.location.href = `https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=1054339746495-1oiv1uf35qqcbjk63r1epda3s5ap7st8.apps.googleusercontent.com&redirect_uri=https://egunkarii.vercel.app/auth/callback&scope=email profile&prompt=select_account`;
  });

  // Cek jika Google library gagal load
  setTimeout(() => {
    if (typeof google === 'undefined') {
      showMessage('errorMessage', 'Google Sign-In tidak tersedia. Gunakan tombol alternatif.');
      document.getElementById('fallbackButton').style.display = 'block';
    }
  }, 3000);
}

// Initialize saat halaman dimuat
window.onload = initGoogleAuth;