import { useState, useEffect } from 'react';
import Head from 'next/head';
import { computeCompatibility } from '../lib/spotify';

const img = (arr, size = 0) => arr?.[size]?.url || arr?.[0]?.url || null;

function scoreLabel(n) {
  if (n >= 85) return { text: 'Soulmates 💞', color: '#ff6b9d' };
  if (n >= 70) return { text: 'Best Friends 🎶', color: '#a855f7' };
  if (n >= 55) return { text: 'Good Vibes ✨', color: '#1DB954' };
  if (n >= 40) return { text: 'Interesting Mix 🎵', color: '#3b82f6' };
  if (n >= 25) return { text: 'Opposites Attract 🔥', color: '#f97316' };
  return { text: 'Musical Strangers 🌍', color: '#6b6b8a' };
}

function Spinner() {
  return (
    <div style={{ display:'flex', justifyContent:'center', padding:'40px 0' }}>
      <div className="spinner" />
      <style>{`.spinner{width:36px;height:36px;border:3px solid rgba(255,255,255,.08);border-top-color:#1DB954;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function UserCard({ slot, user, onLogin, loading }) {
  const isUser1 = slot === 'user1';
  const accent = isUser1 ? '#1DB954' : '#a855f7';

  if (!user && !loading) {
    return (
      <div style={{ background:'var(--card)', border:'1.5px dashed rgba(255,255,255,.1)', borderRadius:20, padding:'32px 24px', display:'flex', alignItems:'center', justifyContent:'center', transition:'border-color .3s' }}>
        <div style={{ textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
          <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,.05)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <p style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.1em' }}>{isUser1 ? 'First Person' : 'Second Person'}</p>
          <button onClick={() => onLogin(slot)} style={{ background:accent, color:'#000', border:'none', padding:'12px 24px', borderRadius:50, fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, cursor:'pointer' }}>
            Connect Spotify
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div style={{ background:'var(--card)', borderRadius:20, padding:32, minHeight:200, display:'flex', alignItems:'center', justifyContent:'center' }}><Spinner /></div>;

  const { profile, topTracks, topArtists } = user;
  const topTrack = topTracks?.short?.[0];
  const topArtist = topArtists?.short?.[0];

  return (
    <div style={{ background:'var(--card)', borderRadius:20, padding:24, border:'1.5px solid var(--border)', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:accent }} />
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
        {profile.images?.[0]?.url
          ? <img src={profile.images[0].url} alt={profile.display_name} style={{ width:56, height:56, borderRadius:'50%', objectFit:'cover', border:`2px solid ${accent}` }} />
          : <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--card2)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:22, fontWeight:700, border:`2px solid ${accent}` }}>{profile.display_name?.[0]}</div>
        }
        <div style={{ flex:1 }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700 }}>{profile.display_name}</h3>
          <p style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{profile.followers?.total?.toLocaleString()} followers</p>
        </div>
        <button onClick={() => onLogin(slot)} style={{ background:'rgba(255,255,255,.05)', border:'none', color:'var(--muted)', width:32, height:32, borderRadius:'50%', cursor:'pointer', fontSize:16 }} title="Switch">↻</button>
      </div>

      {topArtist && (
        <div style={{ background:'var(--bg2)', borderRadius:12, padding:'12px 14px', marginBottom:10 }}>
          <p style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--muted)', fontWeight:600, marginBottom:8 }}>Top Artist</p>
          <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, fontWeight:500 }}>
            {img(topArtist.images) && <img src={img(topArtist.images)} alt={topArtist.name} style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover' }} />}
            <span>{topArtist.name}</span>
          </div>
        </div>
      )}

      {topTrack && (
        <div style={{ background:'var(--bg2)', borderRadius:12, padding:'12px 14px' }}>
          <p style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--muted)', fontWeight:600, marginBottom:8 }}>Top Track</p>
          <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, fontWeight:500 }}>
            {img(topTrack.album?.images) && <img src={img(topTrack.album.images)} alt={topTrack.name} style={{ width:36, height:36, borderRadius:6, objectFit:'cover' }} />}
            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{topTrack.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreRing({ score }) {
  const { text, color } = scoreLabel(score);
  const r = 54, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="10" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
          style={{ filter:`drop-shadow(0 0 8px ${color})` }} />
        <text x="70" y="65" textAnchor="middle" fill="#fff" fontSize="28" fontFamily="Syne" fontWeight="800">{score}%</text>
        <text x="70" y="84" textAnchor="middle" fill="rgba(255,255,255,.5)" fontSize="11" fontFamily="DM Sans">match</text>
      </svg>
      <p style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, color, textAlign:'center' }}>{text}</p>
    </div>
  );
}

function Bar({ label, value, color }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
      <span style={{ fontSize:13, fontWeight:500, width:60, color:'var(--muted)' }}>{label}</span>
      <div style={{ flex:1, height:8, background:'rgba(255,255,255,.06)', borderRadius:99, overflow:'hidden' }}>
        <div style={{ width:`${value}%`, height:'100%', background:color, borderRadius:99, boxShadow:`0 0 10px ${color}40` }} />
      </div>
      <span style={{ fontSize:13, fontWeight:700, width:36, textAlign:'right' }}>{value}%</span>
    </div>
  );
}

function TrackRow({ track, rank }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
      <span style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, color:'var(--muted)', width:20, textAlign:'center' }}>{rank}</span>
      {img(track.album?.images) && <img src={img(track.album.images, 2) || img(track.album.images)} style={{ width:44, height:44, borderRadius:8, objectFit:'cover' }} alt="" />}
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:14, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{track.name}</p>
        <p style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{track.artists?.map(a => a.name).join(', ')}</p>
      </div>
    </div>
  );
}

function ArtistRow({ artist, rank }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
      <span style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, color:'var(--muted)', width:18 }}>{rank}</span>
      {img(artist.images) && <img src={img(artist.images, 2) || img(artist.images)} style={{ width:40, height:40, borderRadius:'50%', objectFit:'cover' }} alt="" />}
      <div>
        <p style={{ fontSize:14, fontWeight:500 }}>{artist.name}</p>
        <p style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{artist.genres?.[0]}</p>
      </div>
    </div>
  );
}

const Card = ({ children, style }) => (
  <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, padding:24, ...style }}>{children}</div>
);
const CardTitle = ({ children, color }) => (
  <h3 style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:700, marginBottom:16, color: color || 'rgba(255,255,255,.8)' }}>{children}</h3>
);

export default function Home() {
  const [users, setUsers] = useState({ user1: null, user2: null });
  const [loading, setLoading] = useState({ user1: false, user2: false });
  const [compat, setCompat] = useState(null);
  const [tab, setTab] = useState('overview');
  const [error, setError] = useState('');

  useEffect(() => {
    ['user1', 'user2'].forEach(slot => {
      const token = sessionStorage.getItem(`${slot}_access_token`);
      if (token) fetchUserData(slot, token);
    });
  }, []);

  async function fetchUserData(slot, token) {
    setLoading(p => ({ ...p, [slot]: true }));
    try {
      const res = await fetch(`/api/user-data?access_token=${token}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setUsers(prev => {
        const next = { ...prev, [slot]: data };
        const other = slot === 'user1' ? prev.user2 : prev.user1;
        if (other && data) setCompat(computeCompatibility(slot === 'user1' ? data : other, slot === 'user1' ? other : data));
        return next;
      });
    } catch {
      setError('Could not load data. Please reconnect.');
      sessionStorage.removeItem(`${slot}_access_token`);
    } finally {
      setLoading(p => ({ ...p, [slot]: false }));
    }
  }

  useEffect(() => {
    if (users.user1 && users.user2) setCompat(computeCompatibility(users.user1, users.user2));
    else setCompat(null);
  }, [users.user1, users.user2]);

  async function handleLogin(slot) {
    sessionStorage.removeItem(`${slot}_access_token`);
    setUsers(p => ({ ...p, [slot]: null }));
    setCompat(null);
    const res = await fetch(`/api/auth-url?slot=${slot}`);
    const { url } = await res.json();
    window.location.href = url;
  }

  const both = users.user1 && users.user2;
  const tabs = ['overview', 'artists', 'tracks', 'genres'];

  return (
    <>
      <Head>
        <title>Sammu — Spotify Compatibility</title>
        <meta name="description" content="See how your music taste matches with others" />
      </Head>

      <div style={{ minHeight:'100vh', position:'relative' }}>
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, background:'radial-gradient(ellipse 80% 60% at 20% -10%,rgba(29,185,84,.07) 0,transparent 60%),radial-gradient(ellipse 60% 50% at 80% 110%,rgba(168,85,247,.07) 0,transparent 60%)' }} />

        <header style={{ position:'relative', zIndex:1, textAlign:'center', padding:'48px 24px 24px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <span style={{ fontSize:28, color:'#1DB954' }}>♫</span>
            <span style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:800, letterSpacing:'-.02em', background:'linear-gradient(135deg,#fff,rgba(255,255,255,.6))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>sammu</span>
          </div>
          <p style={{ fontSize:14, color:'var(--muted)', fontStyle:'italic' }}>your music, your match</p>
        </header>

        <main style={{ position:'relative', zIndex:1, maxWidth:1100, margin:'0 auto', padding:'0 20px 80px' }}>
          {error && (
            <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', color:'#fca5a5', padding:'12px 16px', borderRadius:12, marginBottom:24, display:'flex', justifyContent:'space-between' }}>
              ⚠ {error} <button onClick={() => setError('')} style={{ background:'none', border:'none', color:'inherit', cursor:'pointer' }}>✕</button>
            </div>
          )}

          {/* User cards row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:24, alignItems:'center', marginBottom:40 }}>
            <UserCard slot="user1" user={users.user1} onLogin={handleLogin} loading={loading.user1} />
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
              {compat ? <ScoreRing score={compat.overall} /> : (
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, color:'rgba(255,255,255,.12)' }}>VS</div>
                  <p style={{ fontSize:11, color:'var(--muted)', marginTop:4, whiteSpace:'nowrap' }}>Connect both accounts</p>
                </div>
              )}
            </div>
            <UserCard slot="user2" user={users.user2} onLogin={handleLogin} loading={loading.user2} />
          </div>

          {/* Results */}
          {both && compat && (
            <div>
              {/* Tabs */}
              <div style={{ display:'flex', gap:4, background:'var(--card)', padding:6, borderRadius:16, marginBottom:24, width:'fit-content' }}>
                {tabs.map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? 'var(--card2)' : 'none', border:'none', color: tab === t ? '#fff' : 'var(--muted)', padding:'10px 20px', borderRadius:12, fontFamily:'var(--font-display)', fontWeight:600, fontSize:14, cursor:'pointer' }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {tab === 'overview' && (
                <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  <Card>
                    <CardTitle>Compatibility Breakdown</CardTitle>
                    <Bar label="Artists" value={compat.breakdown.artists} color="#1DB954" />
                    <Bar label="Tracks" value={compat.breakdown.tracks} color="#a855f7" />
                    <Bar label="Genres" value={compat.breakdown.genres} color="#3b82f6" />
                  </Card>
                  {compat.sharedArtists.length > 0 && (
                    <Card>
                      <CardTitle>Artists You Both Love</CardTitle>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {compat.sharedArtists.slice(0,6).map(a => (
                          <div key={a.id} style={{ display:'flex', alignItems:'center', gap:8, background:'var(--card2)', padding:'6px 12px 6px 6px', borderRadius:50, fontSize:13, fontWeight:500 }}>
                            {img(a.images) && <img src={img(a.images)} style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover' }} alt="" />}
                            {a.name}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                  {compat.sharedGenres.length > 0 && (
                    <Card>
                      <CardTitle>Shared Genres ♥</CardTitle>
                      {compat.sharedGenres.map(g => <span key={g} style={{ display:'inline-block', padding:'4px 12px', borderRadius:99, fontSize:12, fontWeight:500, background:'rgba(29,185,84,.12)', color:'#1DB954', border:'1px solid rgba(29,185,84,.25)', margin:4 }}>{g}</span>)}
                    </Card>
                  )}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                    <Card><CardTitle color="#1DB954">{users.user1.profile.display_name}'s Genres</CardTitle>{compat.topGenres1.map(g => <span key={g} style={{ display:'inline-block', padding:'4px 12px', borderRadius:99, fontSize:12, background:'rgba(255,255,255,.06)', color:'var(--muted)', margin:4 }}>{g}</span>)}</Card>
                    <Card><CardTitle color="#a855f7">{users.user2.profile.display_name}'s Genres</CardTitle>{compat.topGenres2.map(g => <span key={g} style={{ display:'inline-block', padding:'4px 12px', borderRadius:99, fontSize:12, background:'rgba(255,255,255,.06)', color:'var(--muted)', margin:4 }}>{g}</span>)}</Card>
                  </div>
                </div>
              )}

              {tab === 'artists' && (
                <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                    <Card><CardTitle color="#1DB954">{users.user1.profile.display_name}</CardTitle>{users.user1.topArtists.short.slice(0,10).map((a,i) => <ArtistRow key={a.id} artist={a} rank={i+1} />)}</Card>
                    <Card><CardTitle color="#a855f7">{users.user2.profile.display_name}</CardTitle>{users.user2.topArtists.short.slice(0,10).map((a,i) => <ArtistRow key={a.id} artist={a} rank={i+1} />)}</Card>
                  </div>
                  {compat.sharedArtists.length > 0 && <Card><CardTitle>Artists You Both Have in Top 50</CardTitle><div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>{compat.sharedArtists.map(a => (<div key={a.id} style={{ display:'flex', alignItems:'center', gap:8, background:'var(--card2)', padding:'6px 12px 6px 6px', borderRadius:50, fontSize:13 }}>{img(a.images) && <img src={img(a.images)} style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover' }} alt="" />}{a.name}</div>))}</div></Card>}
                </div>
              )}

              {tab === 'tracks' && (
                <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                    <Card><CardTitle color="#1DB954">{users.user1.profile.display_name}</CardTitle>{users.user1.topTracks.short.slice(0,12).map((t,i) => <TrackRow key={t.id} track={t} rank={i+1} />)}</Card>
                    <Card><CardTitle color="#a855f7">{users.user2.profile.display_name}</CardTitle>{users.user2.topTracks.short.slice(0,12).map((t,i) => <TrackRow key={t.id} track={t} rank={i+1} />)}</Card>
                  </div>
                  {compat.sharedTracks.length > 0
                    ? <Card><CardTitle>Tracks You Both Have in Top 50 🎵</CardTitle>{compat.sharedTracks.map((t,i) => <TrackRow key={t.id} track={t} rank={i+1} />)}</Card>
                    : <Card style={{ textAlign:'center', color:'var(--muted)' }}><p style={{ fontSize:32, marginBottom:8 }}>🎲</p><p>No tracks in common — totally different tastes!</p></Card>
                  }
                </div>
              )}

              {tab === 'genres' && (
                <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  {compat.sharedGenres.length > 0 && <Card><CardTitle>Genres You Share ♥</CardTitle>{compat.sharedGenres.map(g => <span key={g} style={{ display:'inline-block', padding:'4px 12px', borderRadius:99, fontSize:12, fontWeight:500, background:'rgba(29,185,84,.12)', color:'#1DB954', border:'1px solid rgba(29,185,84,.25)', margin:4 }}>{g}</span>)}</Card>}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                    <Card><CardTitle color="#1DB954">{users.user1.profile.display_name}'s Genres</CardTitle>{compat.topGenres1.map(g => <span key={g} style={{ display:'inline-block', padding:'4px 12px', borderRadius:99, fontSize:12, background:'rgba(255,255,255,.06)', color:'var(--muted)', margin:4 }}>{g}</span>)}</Card>
                    <Card><CardTitle color="#a855f7">{users.user2.profile.display_name}'s Genres</CardTitle>{compat.topGenres2.map(g => <span key={g} style={{ display:'inline-block', padding:'4px 12px', borderRadius:99, fontSize:12, background:'rgba(255,255,255,.06)', color:'var(--muted)', margin:4 }}>{g}</span>)}</Card>
                  </div>
                </div>
              )}
            </div>
          )}

          {(users.user1 || users.user2) && !both && (
            <div style={{ background:'linear-gradient(135deg,rgba(29,185,84,.1),rgba(168,85,247,.1))', border:'1px solid rgba(255,255,255,.08)', borderRadius:20, padding:24, textAlign:'center', fontSize:15, color:'rgba(255,255,255,.7)', marginTop:8 }}>
              🎵 Now connect the second account to see your compatibility!
            </div>
          )}

          {!users.user1 && !users.user2 && (
            <div style={{ textAlign:'center', padding:'40px 20px', maxWidth:480, margin:'0 auto' }}>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, marginBottom:12 }}>Discover your music bond</h2>
              <p style={{ fontSize:15, color:'var(--muted)', lineHeight:1.7 }}>Connect two Spotify accounts — friends, partners, siblings — and see how your musical worlds collide.</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center', marginTop:24 }}>
                {['💞 Lovers','👯 Best Friends','🎸 Band Members','👨‍👩‍👧 Family'].map(l => (
                  <span key={l} style={{ background:'var(--card)', border:'1px solid var(--border)', padding:'8px 16px', borderRadius:50, fontSize:13, fontWeight:500 }}>{l}</span>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        @media(max-width:700px){
          .users-grid{grid-template-columns:1fr !important}
          .two-col{grid-template-columns:1fr !important}
        }
      `}</style>
    </>
  );
}