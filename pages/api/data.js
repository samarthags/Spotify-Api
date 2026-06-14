import { spotifyFetch, refreshAccessToken } from '../../lib/spotify';
import { upsertUser, getBySpotifyId } from '../../lib/store';

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
  let access_token = cookies.spotify_access_token;
  const refresh_token = cookies.spotify_refresh_token;

  if (!access_token && !refresh_token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Try to refresh if no access token
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

  try {
    const [me, nowPlaying, topTracks, topArtists, recentlyPlayed] = await Promise.all([
      spotifyFetch('/me', access_token),
      spotifyFetch('/me/player/currently-playing', access_token),
      spotifyFetch('/me/top/tracks?limit=10&time_range=short_term', access_token),
      spotifyFetch('/me/top/artists?limit=8&time_range=short_term', access_token),
      spotifyFetch('/me/player/recently-played?limit=10', access_token),
    ]);

    // Compute music personality based on top genres
    const genres = {};
    if (topArtists?.items) {
      topArtists.items.forEach((a) => {
        a.genres?.forEach((g) => {
          genres[g] = (genres[g] || 0) + 1;
        });
      });
    }
    const topGenres = Object.entries(genres)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([g]) => g);

    // Persist refresh token + profile basics so a public, no-login profile
    // page can be served for this user if they choose to publish it.
    let shareInfo = null;
    if (me?.id && refresh_token) {
      const existing = getBySpotifyId(me.id);
      const saved = upsertUser(me.id, {
        refreshToken: refresh_token,
        displayName: me.display_name || null,
        avatar: me.images?.[0]?.url || null,
        username: existing?.username || null,
        isPublic: existing?.isPublic || false,
      });
      shareInfo = { username: saved.username, isPublic: saved.isPublic };
    }

    res.json({
      me,
      nowPlaying: nowPlaying?.item || null,
      isPlaying: nowPlaying?.is_playing || false,
      topTracks: topTracks?.items || [],
      topArtists: topArtists?.items || [],
      recentlyPlayed: recentlyPlayed?.items || [],
      topGenres,
      share: shareInfo,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Spotify data', details: err.message });
  }
}