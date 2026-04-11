export function matchUsers(u1, u2) {
  const a1 = u1.artists.map(a => a.name);
  const a2 = u2.artists.map(a => a.name);

  const t1 = u1.tracks.map(t => t.name);
  const t2 = u2.tracks.map(t => t.name);

  const commonArtists = a1.filter(a => a2.includes(a));
  const commonTracks = t1.filter(t => t2.includes(t));

  const score = Math.min(
    100,
    commonArtists.length * 10 + commonTracks.length * 5
  );

  return {
    score,
    commonArtists,
    commonTracks,
  };
}