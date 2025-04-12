function loginWithGoogle() {
  try {
    const clientId = "1054339746495-1oiv1uf35qqcbjk63r1epda3s5ap7st8.apps.googleusercontent.com";
    const redirectUri = encodeURIComponent("https://egunkarii.vercel.app/api/callback");
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${redirectUri}` +
      `&response_type=code` +
      `&scope=profile%20email` +
      `&access_type=offline` +
      `&prompt=consent`;
    
    window.location.href = authUrl;
  } catch (error) {
    console.error('Login error:', error);
    alert('Failed to initiate login. Please try again.');
  }
}