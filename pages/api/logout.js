export default function handler(req, res) {
  res.setHeader('Set-Cookie', [
    'spotify_access_token=; Path=/; Max-Age=0',
    'spotify_refresh_token=; Path=/; Max-Age=0',
  ]);
  res.redirect('/');
}
