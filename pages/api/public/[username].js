import { spotifyFetch, refreshAccessToken } from '../../../lib/spotify';
import { getByUsername, upsertUser } from '../../../lib/store';

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Missing username' });
  }

  const record = getByUsername(username);

  if (!record || !record.isPublic || !record.refreshToken) {
    return res.status(404).json({ error: 'Profile not found or not public' });
  }

  let access_token;
  try {
    const tokens = await refreshAccessToken(record.refreshToken);
    access_token = tokens.access_token;
    // Spotify may rotate the refresh token
    if (tokens.refresh_token) {
      upsertUser(record.spotifyId, { refreshToken: tokens.refresh_token });
    }
  } catch {
    return res.status(502).json({ error: 'Unable to refresh access token' });
  }

  try {
    const [me, nowPlaying, topTracks, topArtists, recentlyPlayed] = await Promise.all([
      spotifyFetch('/me', access_token),
      spotifyFetch('/me/player/currently-playing', access_token),
      spotifyFetch('/me/top/tracks?limit=10&time_range=short_term', access_token),
      spotifyFetch('/me/top/artists?limit=8&time_range=short_term', access_token),
      spotifyFetch('/me/player/recently-played?limit=10', access_token),
    ]);

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

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      displayName: me?.display_name || record.displayName,
      avatar: me?.images?.[0]?.url || record.avatar,
      nowPlaying: nowPlaying?.item || null,
      isPlaying: nowPlaying?.is_playing || false,
      topTracks: topTracks?.items || [],
      topArtists: topArtists?.items || [],
      recentlyPlayed: recentlyPlayed?.items || [],
      topGenres,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Spotify data', details: err.message });
  }
}
