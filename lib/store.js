// Lightweight JSON-file based store for public profile data.
// Maps a chosen public username -> Spotify refresh token + spotify user id.
// Swap this out for MongoDB/Redis in production (Vercel's filesystem is read-only
// at runtime except /tmp, so for serverless deploys point DATA_DIR at a real DB).

import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || '/tmp';
const FILE = path.join(DATA_DIR, 'aura-users.json');

function readAll() {
  try {
    const raw = fs.readFileSync(FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeAll(data) {
  try {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('store write failed', err);
  }
}

// key by spotify user id
export function getBySpotifyId(spotifyId) {
  const all = readAll();
  return all[spotifyId] || null;
}

export function getByUsername(username) {
  const all = readAll();
  const lower = username.toLowerCase();
  for (const id of Object.keys(all)) {
    if (all[id].username && all[id].username.toLowerCase() === lower) {
      return all[id];
    }
  }
  return null;
}

export function isUsernameTaken(username, exceptSpotifyId) {
  const existing = getByUsername(username);
  if (!existing) return false;
  if (exceptSpotifyId && existing.spotifyId === exceptSpotifyId) return false;
  return true;
}

export function upsertUser(spotifyId, fields) {
  const all = readAll();
  all[spotifyId] = { ...(all[spotifyId] || {}), spotifyId, ...fields };
  writeAll(all);
  return all[spotifyId];
}
