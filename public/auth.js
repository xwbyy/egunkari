function showError(message) {
  const errorElement = document.getElementById('errorMessage');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  setTimeout(() => errorElement.style.display = 'none', 5000);
}

async function handleCredentialResponse(response) {
  try {
    console.log('Google response:', response); // Debug
    
    const res = await fetch('/auth/callback', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: response.credential })
    });

    const data = await res.json();
    
    if (data.success) {
      localStorage.setItem('jwt_token', data.token);
      window.location.href = '/dashboard';
    } else {
      showError(data.message || 'Login gagal');
    }
  } catch (error) {
    console.error('Error:', error);
    showError('Terjadi kesalahan saat login');
  }
}

// Cek error dari URL
window.onload = function() {
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  if (error) showError(decodeURIComponent(error));
  
  // Debugging
  console.log('Google client loaded:', typeof google !== 'undefined');
  if (typeof google === 'undefined') {
    showError('Google Sign-In library gagal dimuat. Silakan refresh halaman.');
  }
};