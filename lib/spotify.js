const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

export function getAuthUrl(slot) {
  const scopes = [
    'user-top-read',
    'user-read-recently-played',
    'user-read-private',
    'user-read-email',
  ].join(' ');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: scopes,
    redirect_uri: REDIRECT_URI,
    state: slot,
    show_dialog: 'true',
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function getAccessToken(code) {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });
  return res.json();
}

export async function spotifyFetch(endpoint, accessToken) {
  const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
  return res.json();
}

export async function getUserData(accessToken) {
  const [profile, topTracksShort, topTracksMedium, topArtistsShort, topArtistsMedium] = await Promise.all([
    spotifyFetch('/me', accessToken),
    spotifyFetch('/me/top/tracks?limit=50&time_range=short_term', accessToken),
    spotifyFetch('/me/top/tracks?limit=50&time_range=medium_term', accessToken),
    spotifyFetch('/me/top/artists?limit=50&time_range=short_term', accessToken),
    spotifyFetch('/me/top/artists?limit=50&time_range=medium_term', accessToken),
  ]);

  return {
    profile,
    topTracks: { short: topTracksShort.items, medium: topTracksMedium.items },
    topArtists: { short: topArtistsShort.items, medium: topArtistsMedium.items },
  };
}

export function computeCompatibility(data1, data2) {
  const artists1 = new Set(data1.topArtists.medium.map(a => a.id));
  const artists2 = new Set(data2.topArtists.medium.map(a => a.id));
  const sharedArtists = [...artists1].filter(id => artists2.has(id));
  const artistScore = (sharedArtists.length / Math.max(artists1.size, 1)) * 100;

  const tracks1 = new Set(data1.topTracks.medium.map(t => t.id));
  const tracks2 = new Set(data2.topTracks.medium.map(t => t.id));
  const sharedTracks = [...tracks1].filter(id => tracks2.has(id));
  const trackScore = (sharedTracks.length / Math.max(tracks1.size, 1)) * 100;

  const genres1 = data1.topArtists.medium.flatMap(a => a.genres);
  const genres2 = data2.topArtists.medium.flatMap(a => a.genres);
  const genreSet1 = new Set(genres1);
  const genreSet2 = new Set(genres2);
  const sharedGenres = [...genreSet1].filter(g => genreSet2.has(g));
  const genreScore = (sharedGenres.length / Math.max(genreSet1.size, 1)) * 100;

  const overall = Math.round(artistScore * 0.4 + trackScore * 0.35 + genreScore * 0.25);

  const sharedArtistDetails = data1.topArtists.medium.filter(a => artists2.has(a.id)).slice(0, 10);
  const sharedTrackDetails = data1.topTracks.medium.filter(t => tracks2.has(t.id)).slice(0, 10);

  const getTopGenres = (artists) => {
    const counts = {};
    artists.forEach(a => a.genres.forEach(g => { counts[g] = (counts[g] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([g]) => g);
  };

  return {
    overall: Math.min(overall, 99),
    breakdown: {
      artists: Math.round(Math.min(artistScore, 99)),
      tracks: Math.round(Math.min(trackScore, 99)),
      genres: Math.round(Math.min(genreScore, 99)),
    },
    sharedArtists: sharedArtistDetails,
    sharedTracks: sharedTrackDetails,
    sharedGenres: sharedGenres.slice(0, 12),
    topGenres1: getTopGenres(data1.topArtists.medium),
    topGenres2: getTopGenres(data2.topArtists.medium),
  };
}