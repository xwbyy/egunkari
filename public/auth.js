function showError(message) {
  const errorElement = document.getElementById('errorMessage');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  setTimeout(() => errorElement.style.display = 'none', 5000);
}

function showSuccess(message) {
  const successElement = document.createElement('div');
  successElement.className = 'success-message';
  successElement.textContent = message;
  document.querySelector('.login-container').appendChild(successElement);
  setTimeout(() => successElement.remove(), 3000);
}

async function handleCredentialResponse(response) {
  try {
    console.log('Mengirim token ke server...');
    
    const res = await fetch('/auth/callback', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: response.credential })
    });

    const data = await res.json();
    
    if (data.success) {
      console.log('Login berhasil, menyimpan token...');
      localStorage.setItem('jwt_token', data.token);
      showSuccess('Login berhasil! Mengarahkan ke dashboard...');
      
      // Tunggu 2 detik sebelum redirect
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } else {
      console.error('Error dari server:', data.message);
      showError(data.message || 'Login gagal');
    }
  } catch (error) {
    console.error('Error:', error);
    showError('Terjadi kesalahan saat login: ' + error.message);
  }
}

// Cek status login saat halaman dimuat
window.onload = function() {
  // Cek error dari URL
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  if (error) showError(decodeURIComponent(error));
  
  // Debugging
  console.log('Google client loaded:', typeof google !== 'undefined');
  
  // Jika sudah login, redirect ke dashboard
  if (localStorage.getItem('jwt_token')) {
    window.location.href = '/dashboard';
  }
  
  // Fallback jika Google library gagal load
  setTimeout(() => {
    if (typeof google === 'undefined') {
      showError('Google Sign-In library gagal dimuat. Silakan refresh halaman.');
      document.getElementById('fallbackButton').style.display = 'block';
    }
  }, 3000);
};