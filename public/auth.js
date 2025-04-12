function loginWithGoogle() {
  const { GOOGLE_CLIENT_ID, BASE_URL } = {
    GOOGLE_CLIENT_ID: "1054339746495-1oiv1uf35qqcbjk63r1epda3s5ap7st8.apps.googleusercontent.com",
    BASE_URL: "https://egunkarii.vercel.app"
  };
  
  const redirectUri = `${BASE_URL}/api/callback`;
  const scope = "profile email";
  const responseType = "code";

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', responseType);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  window.location.href = authUrl.toString();
}