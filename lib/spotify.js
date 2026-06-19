const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/callback';

const SCOPES = [
  'user-read-currently-playing',
  'user-read-recently-played',
  'user-top-read',
  'user-read-playback-state',
  'user-read-private',
  'user-read-email',
  'playlist-modify-public',
].join(' ');

export function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    show_dialog: 'true',
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function getAccessToken(code) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
  });
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body,
  });
  return res.json();
}

export async function refreshAccessToken(refresh_token) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token,
  });
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body,
  });
  return res.json();
}

export async function spotifyFetch(endpoint, access_token) {
  const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (res.status === 204 || res.status === 202) return null;
  return res.json();
}

export async function spotifyPost(endpoint, access_token, body) {
  const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (res.status === 204 || res.status === 202) return null;
  return res.json();
}

export async function spotifyPut(endpoint, access_token, body) {
  const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': body ? 'application/json' : undefined,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204 || res.status === 202) return null;
  return res.json();
}

export async function spotifyUploadPlaylistImage(playlistId, access_token, imageBase64) {
  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/images`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'image/jpeg',
    },
    body: imageBase64,
  });
  return res.status;
}

// ── Manual Protobuf encoder/decoder — no dependencies ──

function writeVarint(value) {
  const bytes = [];
  while (value > 0x7f) {
    bytes.push((value & 0x7f) | 0x80);
    value >>>= 7;
  }
  bytes.push(value & 0x7f);
  return Buffer.from(bytes);
}

function writeString(fieldNum, str) {
  const strBuf = Buffer.from(str, 'utf8');
  return Buffer.concat([
    writeVarint((fieldNum << 3) | 2),
    writeVarint(strBuf.length),
    strBuf,
  ]);
}

function writeEmbedded(fieldNum, msgBuf) {
  return Buffer.concat([
    writeVarint((fieldNum << 3) | 2),
    writeVarint(msgBuf.length),
    msgBuf,
  ]);
}

function encodeCanvasRequest(trackUri) {
  const inner = writeString(1, trackUri);  // TrackUri.track_uri
  return writeEmbedded(1, inner);          // EntityCanvazRequest.tracks
}

function readVarint(buf, offset) {
  let result = 0;
  let shift = 0;
  let pos = offset;
  while (pos < buf.length) {
    const b = buf[pos++];
    result |= (b & 0x7f) << shift;
    if (!(b & 0x80)) break;
    shift += 7;
  }
  return { value: result, pos };
}

function decodeFields(buf) {
  const fields = {};
  let pos = 0;
  while (pos < buf.length) {
    const { value: tag, pos: p1 } = readVarint(buf, pos);
    pos = p1;
    const fieldNum = tag >>> 3;
    const wireType = tag & 0x7;

    if (wireType === 0) {
      const { value, pos: p2 } = readVarint(buf, pos);
      pos = p2;
      if (!fields[fieldNum]) fields[fieldNum] = [];
      fields[fieldNum].push({ type: 'varint', value });
    } else if (wireType === 2) {
      const { value: len, pos: p2 } = readVarint(buf, pos);
      pos = p2;
      const data = buf.slice(pos, pos + len);
      pos += len;
      if (!fields[fieldNum]) fields[fieldNum] = [];
      fields[fieldNum].push({ type: 'bytes', value: data });
    } else if (wireType === 1) {
      pos += 8;
    } else if (wireType === 5) {
      pos += 4;
    } else {
      break;
    }
  }
  return fields;
}

function decodeCanvasUrl(responseBuf) {
  // EntityCanvazResponse.canvases = field 1
  const responseFields = decodeFields(responseBuf);
  const canvasesField = responseFields[1];
  if (!canvasesField || canvasesField.length === 0) return null;

  // Canvas.canvas_url = field 2
  const canvasFields = decodeFields(canvasesField[0].value);
  const canvasUrlField = canvasFields[2];
  if (!canvasUrlField || canvasUrlField.length === 0) return null;

  return canvasUrlField[0].value.toString('utf8');
}

export async function getCanvasUrl(trackUri, access_token) {
  try {
    const body = encodeCanvasRequest(trackUri);

    const res = await fetch('https://spclient.wg.spotify.com/canvaz-cache/v0/canvases', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/x-protobuf',
        'Accept': 'application/x-protobuf',
      },
      body,
    });

    if (!res.ok) {
      console.error('Canvas API status:', res.status);
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    return decodeCanvasUrl(buffer);
  } catch (err) {
    console.error('Canvas error:', err.message);
    return null;
  }
}