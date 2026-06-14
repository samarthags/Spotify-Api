import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';

function msToTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const PERSONALITY_MAP = {
  'pop': { label: 'Pop Royalty', emoji: '👑', color: '#f72585' },
  'hip hop': { label: 'Hip-Hop Head', emoji: '🎤', color: '#ff9500' },
  'rap': { label: 'Rap Aficionado', emoji: '🔥', color: '#ff4d4d' },
  'indie': { label: 'Indie Soul', emoji: '🌿', color: '#7bed9f' },
  'electronic': { label: 'Electronic Nomad', emoji: '⚡', color: '#70dbdb' },
  'rock': { label: 'Rock Believer', emoji: '🎸', color: '#ff6b6b' },
  'r&b': { label: 'R&B Lover', emoji: '🎶', color: '#da8fff' },
  'soul': { label: 'Soul Seeker', emoji: '✨', color: '#ffa94d' },
  'jazz': { label: 'Jazz Wanderer', emoji: '🎺', color: '#74c0fc' },
  'classical': { label: 'Classical Mind', emoji: '🎼', color: '#a9e34b' },
  'metal': { label: 'Metal Warrior', emoji: '⚔️', color: '#ff4444' },
  'country': { label: 'Country Soul', emoji: '🤠', color: '#f9c74f' },
  'latin': { label: 'Latin Fire', emoji: '💃', color: '#ff6eb4' },
  'k-pop': { label: 'K-Pop Devotee', emoji: '🌸', color: '#ff85a2' },
};

function getPersonality(genres) {
  for (const genre of (genres || [])) {
    for (const [key, val] of Object.entries(PERSONALITY_MAP)) {
      if (genre.toLowerCase().includes(key)) return val;
    }
  }
  return { label: 'Musical Explorer', emoji: '🌍', color: '#1DB954' };
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tracks');
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      if (res.status === 401) { router.push('/'); return; }
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const personality = data ? getPersonality(data.topGenres) : null;

  return (
    <>
      <Head>
        <title>Aura Dashboard</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #080808; --surface: #111111; --surface2: #181818;
          --border: #1e1e1e; --green: #1DB954; --green-glow: rgba(29,185,84,0.4);
          --white: #fff; --muted: #555; --text: #e0e0e0;
        }
        html, body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; min-height: 100vh; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bar { 0%,100% { height: 6px; } 50% { height: 22px; } }
        @keyframes now-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }

        .loader { display: flex; align-items: center; justify-content: center; min-height: 100vh; flex-direction: column; gap: 16px; }
        .loader-ring { width: 48px; height: 48px; border: 2px solid #1a1a1a; border-top-color: var(--green); border-radius: 50%; animation: spin 0.8s linear infinite; }
        .loader-text { font-size: 13px; color: var(--muted); letter-spacing: 1px; }

        .dash { max-width: 1200px; margin: 0 auto; padding: 0 24px 80px; animation: fade-in 0.5s ease; }

        /* NAV */
        .dash-nav { display: flex; align-items: center; justify-content: space-between; padding: 24px 0; margin-bottom: 8px; border-bottom: 1px solid var(--border); }
        .dash-logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 20px; color: var(--white); display: flex; align-items: center; gap: 8px; }
        .dash-logo span { color: var(--green); }
        .dash-user { display: flex; align-items: center; gap: 12px; }
        .dash-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid var(--green); }
        .dash-avatar-placeholder { width: 36px; height: 36px; border-radius: 50%; background: var(--surface2); border: 2px solid var(--green); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; color: var(--green); }
        .dash-username { font-size: 14px; font-weight: 500; color: var(--white); }
        .btn-logout { font-size: 12px; color: var(--muted); text-decoration: none; padding: 6px 14px; border: 1px solid var(--border); border-radius: 100px; transition: all 0.2s; }
        .btn-logout:hover { color: var(--white); border-color: var(--muted); }

        /* NOW PLAYING */
        .now-playing {
          margin: 32px 0 24px;
          background: linear-gradient(135deg, #0d1f12 0%, #0a0f0a 100%);
          border: 1px solid rgba(29,185,84,0.2);
          border-radius: 20px; padding: 28px 32px;
          display: flex; align-items: center; gap: 28px;
          position: relative; overflow: hidden;
        }
        .now-playing::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--green), transparent); }
        .np-art { width: 88px; height: 88px; border-radius: 12px; object-fit: cover; flex-shrink: 0; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
        .np-art-placeholder { width: 88px; height: 88px; border-radius: 12px; background: var(--surface2); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 32px; }
        .np-info { flex: 1; min-width: 0; }
        .np-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--green); margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
        .np-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: now-pulse 1.5s ease-in-out infinite; box-shadow: 0 0 8px var(--green); }
        .np-track { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 22px; color: var(--white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
        .np-artist { font-size: 14px; color: var(--muted); }
        .np-bars { display: flex; align-items: flex-end; gap: 3px; height: 28px; flex-shrink: 0; }
        .np-bar { width: 4px; border-radius: 2px; background: var(--green); }
        .np-bar:nth-child(1) { animation: bar 1s 0.0s ease-in-out infinite; }
        .np-bar:nth-child(2) { animation: bar 1s 0.15s ease-in-out infinite; }
        .np-bar:nth-child(3) { animation: bar 1s 0.3s ease-in-out infinite; }
        .np-bar:nth-child(4) { animation: bar 1s 0.1s ease-in-out infinite; }
        .np-duration { font-size: 13px; color: #333; font-variant-numeric: tabular-nums; }

        .np-idle { opacity: 0.5; }
        .np-idle .np-track { font-size: 16px; color: var(--muted); }

        /* PERSONALITY */
        .personality-card {
          margin-bottom: 24px;
          border-radius: 16px; padding: 20px 24px;
          display: flex; align-items: center; gap: 16px;
          background: var(--surface);
          border: 1px solid var(--border);
        }
        .p-emoji { font-size: 36px; }
        .p-label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
        .p-name { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; }
        .p-genres { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
        .p-genre { font-size: 11px; padding: 3px 10px; border-radius: 100px; background: rgba(255,255,255,0.06); color: var(--muted); text-transform: capitalize; }

        /* GRID */
        .dash-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }

        /* TABS */
        .card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
        .card-header { padding: 20px 24px 0; }
        .card-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--white); margin-bottom: 16px; }
        .tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); }
        .tab { padding: 10px 18px; font-size: 13px; font-weight: 500; color: var(--muted); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.2s; }
        .tab:hover { color: var(--white); }
        .tab.active { color: var(--green); border-color: var(--green); }

        /* TRACK ROW */
        .track-list { padding: 8px 0; }
        .track-row { display: flex; align-items: center; gap: 14px; padding: 10px 24px; transition: background 0.15s; cursor: default; }
        .track-row:hover { background: var(--surface2); }
        .track-num { font-size: 13px; color: #333; width: 20px; text-align: center; font-variant-numeric: tabular-nums; flex-shrink: 0; }
        .track-art { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
        .track-art-placeholder { width: 40px; height: 40px; border-radius: 6px; background: var(--surface2); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .track-info { flex: 1; min-width: 0; }
        .track-name { font-size: 14px; font-weight: 500; color: var(--white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
        .track-artist { font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .track-duration { font-size: 12px; color: #333; flex-shrink: 0; font-variant-numeric: tabular-nums; }

        /* ARTISTS */
        .artist-list { padding: 8px 0; }
        .artist-row { display: flex; align-items: center; gap: 14px; padding: 10px 24px; transition: background 0.15s; cursor: default; }
        .artist-row:hover { background: var(--surface2); }
        .artist-img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .artist-img-placeholder { width: 44px; height: 44px; border-radius: 50%; background: var(--surface2); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .artist-name { font-size: 14px; font-weight: 500; color: var(--white); }
        .artist-genres { font-size: 11px; color: var(--muted); text-transform: capitalize; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .artist-rank { font-size: 13px; color: #333; margin-left: auto; flex-shrink: 0; }

        /* RECENT SIDEBAR */
        .sidebar-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
        .recent-list { padding: 8px 0; }
        .recent-row { display: flex; gap: 12px; padding: 10px 20px; transition: background 0.15s; align-items: center; }
        .recent-row:hover { background: var(--surface2); }
        .recent-art { width: 38px; height: 38px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
        .recent-art-placeholder { width: 38px; height: 38px; border-radius: 6px; background: var(--surface2); flex-shrink: 0; }
        .recent-info { flex: 1; min-width: 0; }
        .recent-name { font-size: 13px; font-weight: 500; color: var(--white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
        .recent-artist { font-size: 11px; color: var(--muted); }
        .recent-time { font-size: 10px; color: #333; flex-shrink: 0; }

        .empty { padding: 40px 24px; text-align: center; color: var(--muted); font-size: 13px; }

        @media (max-width: 768px) {
          .dash { padding: 0 16px 60px; }
          .now-playing { flex-direction: column; text-align: center; }
          .np-bars { display: none; }
          .dash-grid { grid-template-columns: 1fr; }
          .np-track { font-size: 18px; }
        }
      `}</style>

      {loading ? (
        <div className="loader">
          <div className="loader-ring" />
          <p className="loader-text">Loading your universe...</p>
        </div>
      ) : (
        <div className="dash">
          {/* NAV */}
          <nav className="dash-nav">
            <div className="dash-logo">Aura <span>·</span> Dashboard</div>
            <div className="dash-user">
              {data?.me?.images?.[0]?.url ? (
                <img className="dash-avatar" src={data.me.images[0].url} alt={data.me.display_name} />
              ) : (
                <div className="dash-avatar-placeholder">
                  {data?.me?.display_name?.[0] || '?'}
                </div>
              )}
              <span className="dash-username">{data?.me?.display_name || 'Listener'}</span>
              <a href="/api/logout" className="btn-logout">Logout</a>
            </div>
          </nav>

          {/* NOW PLAYING */}
          <div className={`now-playing ${!data?.isPlaying ? 'np-idle' : ''}`}>
            {data?.nowPlaying?.album?.images?.[0]?.url ? (
              <img className="np-art" src={data.nowPlaying.album.images[0].url} alt="Album art" />
            ) : (
              <div className="np-art-placeholder">🎵</div>
            )}
            <div className="np-info">
              <div className="np-label">
                {data?.isPlaying ? <><div className="np-dot" /> Now Playing</> : 'Last Played'}
              </div>
              <div className="np-track">
                {data?.nowPlaying?.name || 'Nothing playing right now'}
              </div>
              {data?.nowPlaying && (
                <div className="np-artist">
                  {data.nowPlaying.artists?.map(a => a.name).join(', ')}
                  <span style={{ color: '#333', margin: '0 8px' }}>·</span>
                  {data.nowPlaying.album?.name}
                </div>
              )}
              {data?.nowPlaying?.duration_ms && (
                <div style={{ marginTop: 8 }}>
                  <span className="np-duration">{msToTime(data.nowPlaying.duration_ms)}</span>
                </div>
              )}
            </div>
            {data?.isPlaying && (
              <div className="np-bars">
                <div className="np-bar" />
                <div className="np-bar" />
                <div className="np-bar" />
                <div className="np-bar" />
                <div className="np-bar" />
              </div>
            )}
          </div>

          {/* PERSONALITY */}
          {personality && (
            <div className="personality-card" style={{ borderColor: personality.color + '33' }}>
              <div className="p-emoji">{personality.emoji}</div>
              <div>
                <div className="p-label">Your Music Personality</div>
                <div className="p-name" style={{ color: personality.color }}>{personality.label}</div>
                {data?.topGenres?.length > 0 && (
                  <div className="p-genres">
                    {data.topGenres.map(g => (
                      <span className="p-genre" key={g}>{g}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MAIN GRID */}
          <div className="dash-grid">
            {/* LEFT: Tracks + Artists */}
            <div className="card">
              <div className="card-header">
                <div className="tabs">
                  <div className={`tab ${activeTab === 'tracks' ? 'active' : ''}`} onClick={() => setActiveTab('tracks')}>Top Tracks</div>
                  <div className={`tab ${activeTab === 'artists' ? 'active' : ''}`} onClick={() => setActiveTab('artists')}>Top Artists</div>
                </div>
              </div>

              {activeTab === 'tracks' && (
                <div className="track-list">
                  {data?.topTracks?.length ? data.topTracks.map((t, i) => (
                    <div className="track-row" key={t.id}>
                      <span className="track-num">{i + 1}</span>
                      {t.album?.images?.[2]?.url ? (
                        <img className="track-art" src={t.album.images[2].url} alt={t.name} />
                      ) : (
                        <div className="track-art-placeholder">🎵</div>
                      )}
                      <div className="track-info">
                        <div className="track-name">{t.name}</div>
                        <div className="track-artist">{t.artists?.map(a => a.name).join(', ')}</div>
                      </div>
                      <span className="track-duration">{msToTime(t.duration_ms)}</span>
                    </div>
                  )) : <div className="empty">No top tracks found yet.</div>}
                </div>
              )}

              {activeTab === 'artists' && (
                <div className="artist-list">
                  {data?.topArtists?.length ? data.topArtists.map((a, i) => (
                    <div className="artist-row" key={a.id}>
                      <span className="track-num">{i + 1}</span>
                      {a.images?.[2]?.url ? (
                        <img className="artist-img" src={a.images[2].url} alt={a.name} />
                      ) : (
                        <div className="artist-img-placeholder">🎤</div>
                      )}
                      <div>
                        <div className="artist-name">{a.name}</div>
                        <div className="artist-genres">{a.genres?.slice(0, 2).join(', ')}</div>
                      </div>
                      <span className="artist-rank" style={{ color: '#1DB954', fontSize: 11 }}>
                        {(a.popularity || 0)}% pop.
                      </span>
                    </div>
                  )) : <div className="empty">No top artists found yet.</div>}
                </div>
              )}
            </div>

            {/* RIGHT: Recently Played */}
            <div className="sidebar-card">
              <div className="card-header" style={{ paddingBottom: 16 }}>
                <div className="card-title">Recently Played</div>
              </div>
              <div className="recent-list">
                {data?.recentlyPlayed?.length ? data.recentlyPlayed.map((item, i) => (
                  <div className="recent-row" key={`${item.track?.id}-${i}`}>
                    {item.track?.album?.images?.[2]?.url ? (
                      <img className="recent-art" src={item.track.album.images[2].url} alt={item.track.name} />
                    ) : (
                      <div className="recent-art-placeholder" />
                    )}
                    <div className="recent-info">
                      <div className="recent-name">{item.track?.name}</div>
                      <div className="recent-artist">{item.track?.artists?.map(a => a.name).join(', ')}</div>
                    </div>
                    <span className="recent-time">{timeAgo(item.played_at)}</span>
                  </div>
                )) : <div className="empty">No recent history.</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
