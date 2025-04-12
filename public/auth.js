function loginWithGoogle() {
  try {
    // Dynamic base URL
    const baseUrl = window.location.origin;
    const clientId = "1054339746495-1oiv1uf35qqcbjk63r1epda3s5ap7st8.apps.googleusercontent.com";
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', `${baseUrl}/api/callback`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'profile email');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    
    console.log('Redirecting to Google Auth:', authUrl.toString());
    window.location.href = authUrl.toString();
    
  } catch (error) {
    console.error('Login error:', error);
    alert('Failed to initiate login. Please try again.');
  }
}
