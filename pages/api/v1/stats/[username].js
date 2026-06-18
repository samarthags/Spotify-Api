// GET /api/v1/stats/[username]
//
// A stable, public, CORS-enabled JSON endpoint meant to be fetched directly
// from any external website's client-side JavaScript (e.g. samarthags.in),
// with no auth required by the caller. The "username" in the URL is the
// same unique key created via the dashboard's "Create your stats profile"
// flow — it doubles as the public API key for this purpose.
//
// Example:
//   fetch('https://your-aura-app.vercel.app/api/v1/stats/samarth')
//     .then(r => r.json())
//     .then(data => {
//       document.getElementById('current-song').textContent = data.currentlyPlaying.track;
//     });
//
// Response shape is intentionally flat and plain-text friendly so it can be
// dropped straight into HTML without any extra parsing logic.

import { spotifyFetch, refreshAccessToken } from '../../../../lib/spotify';
import { getByUsername, upsertUser } from '../../../../lib/store';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function formatArtists(artists) {
  return (artists || []).map((a) => a.name).join(', ');
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.query;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Missing username' });
  }

  const record = await getByUsername(username);

  if (!record || !record.isPublic || !record.refreshToken) {
    return res.status(404).json({ error: 'Profile not found or not public' });
  }

  let access_token;
  try {
    const tokens = await refreshAccessToken(record.refreshToken);
    access_token = tokens.access_token;
    if (tokens.refresh_token) {
      await upsertUser(record.spotifyId, { refreshToken: tokens.refresh_token });
    }
  } catch {
    return res.status(502).json({ error: 'Unable to refresh access token' });
  }

  try {
    const [nowPlaying, topTracksShort, topArtistsShort, recentlyPlayed] = await Promise.all([
      spotifyFetch('/me/player/currently-playing', access_token),
      spotifyFetch('/me/top/tracks?limit=5&time_range=short_term', access_token),
      spotifyFetch('/me/top/artists?limit=5&time_range=short_term', access_token),
      spotifyFetch('/me/player/recently-played?limit=1', access_token),
    ]);

    const current = nowPlaying?.item || null;
    const lastPlayed = recentlyPlayed?.items?.[0]?.track || null;

    const payload = {
      username: record.username,
      displayName: record.displayName,
      profileUrl: `https://${req.headers.host}/u/${record.username}`,

      currentlyPlaying: {
        isPlaying: !!nowPlaying?.is_playing,
        track: current?.name || null,
        artist: current ? formatArtists(current.artists) : null,
        album: current?.album?.name || null,
        albumArt: current?.album?.images?.[0]?.url || null,
        durationMs: current?.duration_ms || null,
        progressMs: nowPlaying?.progress_ms || null,
        spotifyUrl: current?.external_urls?.spotify || null,
      },

      // Only populated when nothing is currently playing — the most
      // recently played track as a fallback.
      recentlyPlayed: (!nowPlaying?.is_playing && lastPlayed) ? {
        track: lastPlayed.name,
        artist: formatArtists(lastPlayed.artists),
        albumArt: lastPlayed.album?.images?.[0]?.url || null,
        spotifyUrl: lastPlayed.external_urls?.spotify || null,
      } : null,

      topTracks: (topTracksShort?.items || []).map((t) => ({
        track: t.name,
        artist: formatArtists(t.artists),
        albumArt: t.album?.images?.[0]?.url || null,
        spotifyUrl: t.external_urls?.spotify || null,
      })),

      topArtists: (topArtistsShort?.items || []).map((a) => ({
        name: a.name,
        image: a.images?.[0]?.url || null,
        spotifyUrl: a.external_urls?.spotify || null,
      })),

      updatedAt: new Date().toISOString(),
    };

    // Short cache window: keeps "currently playing" close to real-time
    // while avoiding hammering Spotify's API if a page polls frequently.
    res.setHeader('Cache-Control', 'public, max-age=10, s-maxage=10, stale-while-revalidate=30');
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Spotify data', details: err.message });
  }
}
