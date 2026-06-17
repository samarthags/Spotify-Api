import { spotifyFetch, refreshAccessToken } from '../../../lib/spotify';
import { getByUsername, upsertUser } from '../../../lib/store';
import { ensureDailyPlaylist } from '../../../lib/dailyPlaylist';

export default async function handler(req, res) {
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
    // Spotify may rotate the refresh token
    if (tokens.refresh_token) {
      await upsertUser(record.spotifyId, { refreshToken: tokens.refresh_token });
    }
  } catch {
    return res.status(502).json({ error: 'Unable to refresh access token' });
  }

  try {
    const [me, nowPlaying, topTracks, topArtists, recentlyPlayed, topTracksLong, topArtistsLong] = await Promise.all([
      spotifyFetch('/me', access_token),
      spotifyFetch('/me/player/currently-playing', access_token),
      spotifyFetch('/me/top/tracks?limit=10&time_range=short_term', access_token),
      spotifyFetch('/me/top/artists?limit=8&time_range=short_term', access_token),
      spotifyFetch('/me/player/recently-played?limit=50', access_token),
      spotifyFetch('/me/top/tracks?limit=5&time_range=long_term', access_token),
      spotifyFetch('/me/top/artists?limit=5&time_range=long_term', access_token),
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

    const recentItems = recentlyPlayed?.items || [];
    const oldestRecent = recentItems.length
      ? recentItems.reduce((a, b) => (new Date(a.played_at) < new Date(b.played_at) ? a : b))
      : null;

    const recentMinutes = Math.round(
      recentItems.reduce((sum, item) => sum + (item.track?.duration_ms || 0), 0) / 60000
    );
    const popList = (topTracks?.items || []).map((t) => t.popularity).filter((n) => typeof n === 'number');
    const avgPopularity = popList.length ? Math.round(popList.reduce((a, b) => a + b, 0) / popList.length) : null;

    // Pick a 30s preview to play: prefer the live now-playing track, else top track.
    const previewTrack = nowPlaying?.item?.preview_url
      ? nowPlaying.item
      : (topTracks?.items || []).find((t) => t.preview_url) || null;

    const combinedTracks = [...(topTracks?.items || []), ...(topTracksLong?.items || [])];
    const dailyPlaylist = await ensureDailyPlaylist(record.spotifyId, access_token, combinedTracks);

    res.setHeader('Cache-Control', 'no-store');
    res.json({
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
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Spotify data', details: err.message });
  }
}
