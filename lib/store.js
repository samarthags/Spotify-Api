// Supabase-backed store for public profile data.
// Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// (Service role key bypasses RLS — never expose it to the browser; this
// file is only ever imported from pages/api/* which run server-side.)
// Table schema: see supabase-schema.sql

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
    refreshToken: row.refresh_token,
    displayName: row.display_name,
    avatar: row.avatar,
    isPublic: row.is_public,
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

export async function isUsernameTaken(username, exceptSpotifyId) {
  const existing = await getByUsername(username);
  if (!existing) return false;
  if (exceptSpotifyId && existing.spotifyId === exceptSpotifyId) return false;
  return true;
}

export async function upsertUser(spotifyId, fields) {
  const row = { spotify_id: spotifyId };
  if (fields.username !== undefined) row.username = fields.username;
  if (fields.refreshToken !== undefined) row.refresh_token = fields.refreshToken;
  if (fields.displayName !== undefined) row.display_name = fields.displayName;
  if (fields.avatar !== undefined) row.avatar = fields.avatar;
  if (fields.isPublic !== undefined) row.is_public = fields.isPublic;

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
