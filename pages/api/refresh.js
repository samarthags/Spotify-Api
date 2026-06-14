import { refreshAccessToken } from '../../lib/spotify';

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    cookies[name.trim()] = rest.join('=').trim();
  });
  return cookies;
}

export default async function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const refresh_token = cookies.spotify_refresh_token;

  if (!refresh_token) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  try {
    const tokens = await refreshAccessToken(refresh_token);
    const cookieOptions = `Path=/; HttpOnly; SameSite=Lax; Max-Age=3600${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
    res.setHeader('Set-Cookie', `spotify_access_token=${tokens.access_token}; ${cookieOptions}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Refresh failed' });
  }
}
