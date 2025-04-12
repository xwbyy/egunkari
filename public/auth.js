function showError(message) {
  const errorElement = document.getElementById('errorMessage');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  setTimeout(() => errorElement.style.display = 'none', 5000);
}

function initGoogleAuth() {
  google.accounts.id.initialize({
    client_id: '1054339746495-1oiv1uf35qqcbjk63r1epda3s5ap7st8.apps.googleusercontent.com',
    callback: handleCredentialResponse
  });

  google.accounts.id.renderButton(
    document.getElementById('googleSignInButton'),
    { theme: 'filled_blue', size: 'large', width: '300' }
  );

  // Cek error dari URL
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  if (error) showError(decodeURIComponent(error));
}

async function handleCredentialResponse(response) {
  try {
    const res = await fetch('/auth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

window.onload = initGoogleAuth;