function loginWithGoogle() {
  const clientId = "1054339746495-1oiv1uf35qqcbjk63r1epda3s5ap7st8.apps.googleusercontent.com";
  const redirectUri = "https://egunkarii.vercel.app/api/callback";
  const scope = "profile email";
  const responseType = "code";
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}`;
  window.location.href = url;
}