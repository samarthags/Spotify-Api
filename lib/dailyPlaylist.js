

import { spotifyFetch, spotifyPost, spotifyPut, spotifyUploadPlaylistImage } from './spotify';
import { upsertUser } from './store';

function todayUTC() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function prettyDate() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}



export async function ensureDailyPlaylist(spotifyId, access_token, topTracks) {
  try {
    const { getBySpotifyId } = await import('./store');
    const record = await getBySpotifyId(spotifyId);
    const today = todayUTC();

    if (record?.dailyPlaylistDate === today && record?.dailyPlaylistId) {
      // Already refreshed today — nothing to do.
      return {
        id: record.dailyPlaylistId,
        url: record.dailyPlaylistUrl,
        image: record.dailyPlaylistImage,
      };
    }

    const trackUris = (topTracks || [])
      .filter((t) => t?.uri)
      .slice(0, 20)
      .map((t) => t.uri);

    if (!trackUris.length) return null;

    let playlistId = record?.dailyPlaylistId;

    if (!playlistId) {
      const created = await spotifyPost(`/users/${spotifyId}/playlists`, access_token, {
        name: 'Aura Daily',
        description: 'Auto-updated daily by Aura — your top tracks right now.',
        public: true,
      });
      playlistId = created?.id;
      if (!playlistId) return null;
    }

    await spotifyPut(`/playlists/${playlistId}/tracks`, access_token, { uris: trackUris });
    await spotifyPut(`/playlists/${playlistId}`, access_token, {
      name: `Aura Daily — ${prettyDate()}`,
      description: 'Auto-updated daily by Aura — your top tracks right now.',
    });

    const coverImage = null;
    if (coverImage) {
      await spotifyUploadPlaylistImage(playlistId, access_token, coverImage);
    }

    const playlist = await spotifyFetch(`/playlists/${playlistId}`, access_token);
    const url = playlist?.external_urls?.spotify || `https://open.spotify.com/playlist/${playlistId}`;
    const image = playlist?.images?.[0]?.url || topTracks?.[0]?.album?.images?.[0]?.url || null;

    await upsertUser(spotifyId, {
      dailyPlaylistId: playlistId,
      dailyPlaylistUrl: url,
      dailyPlaylistImage: image,
      dailyPlaylistDate: today,
    });

    return { id: playlistId, url, image };
  } catch (err) {
    console.error('ensureDailyPlaylist failed', err);
    return null;
  }
}
