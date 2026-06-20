import { spotifyFetch, refreshAccessToken } from '../../../lib/spotify';
import { getByUsername, upsertUser } from '../../../lib/store';
import { ensureDailyPlaylist } from '../../../lib/dailyPlaylist';

// ── In-memory cache ───────────────────────────────────────────────────────────
const profileCache = {};
const CACHE_TTL_MS = 60_000; // 60 seconds

function getCached(key) {
  const entry = profileCache[key];
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    delete profileCache[key];
    return null;
  }
  return entry.data;
}

function setCached(key, data) {
  profileCache[key] = { data, expiresAt: Date.now() + CACHE_TTL_MS };
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const { username } = req.query;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Missing username' });
  }

  const key = username.toLowerCase();

  // ── Cache hit ───────────────────────────────────────────────────────────────
  const cached = getCached(key);
  if (cached) {
    res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30, stale-while-revalidate=60');
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  // ── Lookup user ─────────────────────────────────────────────────────────────
  const record = await getByUsername(username);

  if (!record || !record.isPublic || !record.refreshToken) {
    return res.status(404).json({ error: 'Profile not found or not public' });
  }

  // ── Refresh Spotify token ───────────────────────────────────────────────────
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

  // ── Fetch all Spotify data in parallel ─────────────────────────────────────
  try {
    const [
      me,
      nowPlaying,
      topTracks,
      topArtists,
      recentlyPlayed,
      topTracksLong,
      topArtistsLong,
    ] = await Promise.all([
      spotifyFetch('/me', access_token),
      spotifyFetch('/me/player/currently-playing', access_token),
      spotifyFetch('/me/top/tracks?limit=10&time_range=short_term', access_token),
      spotifyFetch('/me/top/artists?limit=8&time_range=short_term', access_token),
      spotifyFetch('/me/player/recently-played?limit=50', access_token),
      spotifyFetch('/me/top/tracks?limit=5&time_range=long_term', access_token),
      spotifyFetch('/me/top/artists?limit=5&time_range=long_term', access_token),
    ]);

    // ── Genre aggregation ─────────────────────────────────────────────────────
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

    // ── Recent play stats ─────────────────────────────────────────────────────
    const recentItems = recentlyPlayed?.items || [];
    const oldestRecent = recentItems.length
      ? recentItems.reduce((a, b) => (new Date(a.played_at) < new Date(b.played_at) ? a : b))
      : null;

    const recentMinutes = Math.round(
      recentItems.reduce((sum, item) => sum + (item.track?.duration_ms || 0), 0) / 60000
    );

    const popList = (topTracks?.items || [])
      .map((t) => t.popularity)
      .filter((n) => typeof n === 'number');
    const avgPopularity = popList.length
      ? Math.round(popList.reduce((a, b) => a + b, 0) / popList.length)
      : null;

    // ── Preview track ─────────────────────────────────────────────────────────
    const previewTrack = nowPlaying?.item?.preview_url
      ? nowPlaying.item
      : (topTracks?.items || []).find((t) => t.preview_url) || null;

    // ── Daily playlist ────────────────────────────────────────────────────────
    const combinedTracks = [
      ...(topTracks?.items || []),
      ...(topTracksLong?.items || []),
    ];
    const dailyPlaylist = await ensureDailyPlaylist(
      record.spotifyId,
      access_token,
      combinedTracks
    );

    // ── Build payload ─────────────────────────────────────────────────────────
    const payload = {
      displayName: me?.display_name || record.displayName,
      avatar: me?.images?.[0]?.url || record.avatar,
      nowPlaying: nowPlaying?.item || null,
      isPlaying: nowPlaying?.is_playing || false,
      topTracks: topTracks?.items || [],
      topArtists: topArtists?.items || [],
      recentlyPlayed: recentItems.slice(0, 10),
      topGenres,
      allTimeFavTrack: topTracksLong?.items?.[0] || null,
      allTimeFavArtist: topArtistsLong?.items?.[0] || null,
      oldestRecent: oldestRecent || null,
      recentMinutes,
      avgPopularity,
      previewUrl: previewTrack?.preview_url || null,
      previewTrackName: previewTrack?.name || null,
      dailyPlaylist,
    };

    // ── Store in cache then respond ───────────────────────────────────────────
    setCached(key, payload);

    res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30, stale-while-revalidate=60');
    res.setHeader('X-Cache', 'MISS');
    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch Spotify data', details: err.message });
  }
}
