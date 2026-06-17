import { spotifyFetch, refreshAccessToken } from '../../lib/spotify';
import { getBySpotifyId, upsertUser, isUsernameTaken } from '../../lib/store';

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    cookies[name.trim()] = rest.join('=').trim();
  });
  return cookies;
}

const USERNAME_RE = /^[a-z0-9_-]{3,24}$/;

export default async function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  let access_token = cookies.spotify_access_token;
  const refresh_token = cookies.spotify_refresh_token;

  if (!access_token && !refresh_token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!access_token && refresh_token) {
    try {
      const tokens = await refreshAccessToken(refresh_token);
      access_token = tokens.access_token;
      const cookieOptions = `Path=/; HttpOnly; SameSite=Lax; Max-Age=3600${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
      res.setHeader('Set-Cookie', `spotify_access_token=${access_token}; ${cookieOptions}`);
    } catch {
      return res.status(401).json({ error: 'Token refresh failed' });
    }
  }

  let me;
  try {
    me = await spotifyFetch('/me', access_token);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }

  if (req.method === 'GET') {
    const record = await getBySpotifyId(me.id);
    return res.json({ username: record?.username || null });
  }

  if (req.method === 'POST') {
    const { username } = req.body || {};

    if (typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ error: 'A name is required' });
    }

    const clean = username.trim().toLowerCase();
    if (!USERNAME_RE.test(clean)) {
      return res.status(400).json({ error: 'Use 3-24 characters: letters, numbers, - or _' });
    }
    if (await isUsernameTaken(clean, me.id)) {
      return res.status(409).json({ error: 'That name is already taken' });
    }

    const existing = await getBySpotifyId(me.id);
    const record = await upsertUser(me.id, {
      username: clean,
      isPublic: true,
      refreshToken: refresh_token || existing?.refreshToken,
      displayName: me.display_name || null,
      avatar: me.images?.[0]?.url || null,
    });

    if (!record) {
      return res.status(500).json({ error: 'Could not create your link, try again' });
    }

    return res.json({ username: record.username });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
