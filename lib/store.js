import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

function mapRow(row) {
  if (!row) return null;
  return {
    spotifyId: row.spotify_id,
    username: row.username,
    apiId: row.api_id,
    refreshToken: row.refresh_token,
    displayName: row.display_name,
    avatar: row.avatar,
    isPublic: row.is_public,
    dailyPlaylistId: row.daily_playlist_id,
    dailyPlaylistUrl: row.daily_playlist_url,
    dailyPlaylistImage: row.daily_playlist_image,
    dailyPlaylistDate: row.daily_playlist_date,
  };
}

export async function getBySpotifyId(spotifyId) {
  const { data, error } = await supabase
    .from('aura_users')
    .select('*')
    .eq('spotify_id', spotifyId)
    .maybeSingle();
  if (error) {
    console.error('getBySpotifyId error', error);
    return null;
  }
  return mapRow(data);
}

export async function getByUsername(username) {
  const { data, error } = await supabase
    .from('aura_users')
    .select('*')
    .ilike('username', username)
    .maybeSingle();
  if (error) {
    console.error('getByUsername error', error);
    return null;
  }
  return mapRow(data);
}

export async function getByApiId(apiId) {
  const { data, error } = await supabase
    .from('aura_users')
    .select('*')
    .eq('api_id', apiId)
    .maybeSingle();
  if (error) {
    console.error('getByApiId error', error);
    return null;
  }
  return mapRow(data);
}

export async function isUsernameTaken(username, exceptSpotifyId) {
  const existing = await getByUsername(username);
  if (!existing) return false;
  if (exceptSpotifyId && existing.spotifyId === exceptSpotifyId) return false;
  return true;
}

export async function upsertUser(spotifyId, fields) {
  const row = { spotify_id: spotifyId };
  if (fields.username !== undefined) row.username = fields.username;
  if (fields.apiId !== undefined) row.api_id = fields.apiId;
  if (fields.refreshToken !== undefined) row.refresh_token = fields.refreshToken;
  if (fields.displayName !== undefined) row.display_name = fields.displayName;
  if (fields.avatar !== undefined) row.avatar = fields.avatar;
  if (fields.isPublic !== undefined) row.is_public = fields.isPublic;
  if (fields.dailyPlaylistId !== undefined) row.daily_playlist_id = fields.dailyPlaylistId;
  if (fields.dailyPlaylistUrl !== undefined) row.daily_playlist_url = fields.dailyPlaylistUrl;
  if (fields.dailyPlaylistImage !== undefined) row.daily_playlist_image = fields.dailyPlaylistImage;
  if (fields.dailyPlaylistDate !== undefined) row.daily_playlist_date = fields.dailyPlaylistDate;

  const { data, error } = await supabase
    .from('aura_users')
    .upsert(row, { onConflict: 'spotify_id' })
    .select()
    .single();

  if (error) {
    console.error('upsertUser error', error);
    return null;
  }
  return mapRow(data);
}
