import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';

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

const GENRE_LABELS = {
  'pop': 'Pop',
  'hip hop': 'Hip-Hop',
  'rap': 'Rap',
  'indie': 'Indie',
  'electronic': 'Electronic',
  'rock': 'Rock',
  'r&b': 'R&B',
  'soul': 'Soul',
  'jazz': 'Jazz',
  'classical': 'Classical',
  'metal': 'Metal',
  'country': 'Country',
  'latin': 'Latin',
  'k-pop': 'K-Pop',
};

function getPersonality(genres) {
  for (const genre of (genres || [])) {
    for (const [key, val] of Object.entries(GENRE_LABELS)) {
      if (genre.toLowerCase().includes(key)) return `${val} Listener`;
    }
  }
  return 'Musical Explorer';
}

const Icon = {
  music: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  ),
  link: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L12.5 19.5" />
    </svg>
  ),
  copy: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  globe: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  check: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tracks');
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [savedUsername, setSavedUsername] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      if (res.status === 401) { router.push('/'); return; }
      const json = await res.json();
      setData(json);
      if (json.share?.username) {
        setSavedUsername(json.share.username);
        setUsername(json.share.username);
      }
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

  const shareUrl = savedUsername && typeof window !== 'undefined'
    ? `${window.location.origin}/u/${savedUsername}`
    : '';

  const saveUsername = async () => {
    setShareError('');
    setShareLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim().toLowerCase() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setShareError(json.error || 'Could not save username');
      } else {
        setSavedUsername(json.username);
      }
    } catch {
      setShareError('Something went wrong');
    } finally {
      setShareLoading(false);
    }
  };

  const copyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <Head>
        <title>Aura Dashboard</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        button, a, .tab, .stat-card { -webkit-tap-highlight-color: transparent; outline: none; }
        button:focus, a:focus { outline: none; }
        :root {
          --bg: #0a0a0a; --surface: #121212; --surface2: #1a1a1a;
          --border: #232323; --green: #1DB954;
          --white: #fff; --muted: #a0a0a0; --dim: #6a6a6a; --text: #e6e6e6;
        }
        html, body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; min-height: 100vh; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .loader { display: flex; align-items: center; justify-content: center; min-height: 100vh; flex-direction: column; gap: 16px; }
        .loader-ring { width: 40px; height: 40px; border: 3px solid var(--surface2); border-top-color: var(--green); border-radius: 50%; animation: spin 0.8s linear infinite; }
        .loader-text { font-size: 13px; color: var(--dim); letter-spacing: 0.5px; }

        .dash { max-width: 1100px; margin: 0 auto; padding: 0 20px 60px; }

        .dash-nav { display: flex; align-items: center; justify-content: space-between; padding: 20px 0; margin-bottom: 16px; border-bottom: 1px solid var(--border); }
        .dash-logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 18px; color: var(--white); display: flex; align-items: center; gap: 8px; letter-spacing: -0.3px; }
        .dash-logo span { color: var(--green); }
        .dash-user { display: flex; align-items: center; gap: 12px; }
        .dash-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
        .dash-avatar-placeholder { width: 32px; height: 32px; border-radius: 50%; background: var(--surface2); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: var(--muted); }
        .dash-username { font-size: 14px; font-weight: 500; color: var(--white); }
        .btn-logout { font-size: 12px; color: var(--dim); text-decoration: none; padding: 6px 14px; border: 1px solid var(--border); border-radius: 6px; transition: all 0.15s; }
        .btn-logout:hover { color: var(--white); border-color: var(--muted); }

        .now-playing {
          margin: 16px 0; background: var(--surface); border: 1px solid var(--border);
          border-radius: 8px; padding: 20px; display: flex; align-items: center; gap: 20px;
        }
        .np-art, .np-art-placeholder { width: 72px; height: 72px; border-radius: 6px; object-fit: cover; flex-shrink: 0; background: var(--surface2); }
        .np-art-placeholder { display: flex; align-items: center; justify-content: center; color: var(--dim); }
        .np-info { flex: 1; min-width: 0; }
        .np-label { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--dim); margin-bottom: 6px; display: flex; align-items: center; gap: 6px; font-weight: 600; }
        .np-label.live { color: var(--green); }
        .np-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); }
        .np-track { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 18px; color: var(--white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
        .np-artist { font-size: 13px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .np-duration { font-size: 12px; color: var(--dim); font-variant-numeric: tabular-nums; flex-shrink: 0; }
        .np-idle .np-track { color: var(--muted); font-weight: 600; }

        .personality-card {
          margin-bottom: 16px; border-radius: 8px; padding: 16px 20px;
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          background: var(--surface); border: 1px solid var(--border);
        }
        .p-label { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--dim); margin-bottom: 4px; font-weight: 600; }
        .p-name { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: var(--white); }
        .p-genres { display: flex; gap: 8px; flex-wrap: wrap; }
        .p-genre { font-size: 11px; padding: 4px 10px; border-radius: 100px; background: var(--surface2); color: var(--muted); text-transform: capitalize; border: 1px solid var(--border); }

        .share-card { margin-bottom: 16px; border-radius: 8px; padding: 24px; background: var(--surface); border: 1px solid var(--border); text-align: center; }
        .share-head { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 8px; }
        .share-head .icon { width: 18px; height: 18px; color: var(--green); }
        .share-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--white); }
        .share-desc { font-size: 13px; color: var(--muted); margin-bottom: 18px; line-height: 1.6; max-width: 440px; margin-left: auto; margin-right: auto; }
        .share-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: stretch; justify-content: center; max-width: 460px; margin: 0 auto; }
        .share-input-wrap { display: flex; align-items: center; flex: 1; min-width: 180px; background: var(--surface2); border: 1px solid var(--border); border-radius: 100px; overflow: hidden; transition: border-color 0.15s; }
        .share-input-wrap:focus-within { border-color: var(--green); }
        .share-prefix { padding: 0 0 0 16px; font-size: 13px; color: var(--dim); white-space: nowrap; }
        .share-input { flex: 1; background: transparent; border: none; outline: none; color: var(--white); font-size: 13px; padding: 12px 14px; font-family: 'Inter', sans-serif; }
        .share-btn { font-size: 13px; font-weight: 700; padding: 12px 24px; border-radius: 100px; border: none; cursor: pointer; transition: background 0.15s, transform 0.1s; white-space: nowrap; background: var(--green); color: #000; }
        .share-btn:hover:not(:disabled) { background: #1ed760; }
        .share-btn:active:not(:disabled) { transform: scale(0.97); }
        .share-btn:disabled { opacity: 0.5; cursor: default; }
        .share-error { font-size: 12px; color: #ff6b6b; margin-top: 12px; }

        .share-live { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--border); display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .share-link-row { display: flex; align-items: center; gap: 8px; background: var(--surface2); border: 1px solid var(--border); border-radius: 100px; padding: 8px 8px 8px 16px; max-width: 100%; }
        .share-link { font-size: 13px; color: var(--green); text-decoration: none; word-break: break-all; }
        .icon-btn { background: var(--bg); border: 1px solid var(--border); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--muted); flex-shrink: 0; transition: color 0.15s, border-color 0.15s, transform 0.1s; }
        .icon-btn:hover { color: var(--white); border-color: var(--muted); }
        .icon-btn:active { transform: scale(0.92); }
        .icon-btn .icon { width: 15px; height: 15px; }
        .live-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--green); font-weight: 600; }

        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
        .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px; display: flex; gap: 12px; align-items: center; transition: border-color 0.15s; }
        .stat-card:hover { border-color: var(--muted); }
        .stat-art, .stat-art-placeholder { width: 48px; height: 48px; border-radius: 6px; object-fit: cover; flex-shrink: 0; background: var(--surface2); }
        .stat-art-placeholder { display: flex; align-items: center; justify-content: center; color: var(--dim); }
        .stat-info { flex: 1; min-width: 0; }
        .stat-label { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--dim); font-weight: 600; margin-bottom: 4px; }
        .stat-name { font-size: 13px; font-weight: 600; color: var(--white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
        .stat-sub { font-size: 12px; color: var(--dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .dash-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 16px; }

        .card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
        .card-header { padding: 16px 20px 0; }
        .tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); }
        .tab { padding: 10px 4px; font-size: 13px; font-weight: 600; color: var(--dim); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; margin-right: 20px; transition: color 0.15s, border-color 0.15s; background: none; user-select: none; }
        .tab:hover { color: var(--muted); }
        .tab.active { color: var(--white); border-color: var(--green); }
        .tab:active { color: var(--green); }

        .track-list, .artist-list { padding: 6px 0; }
        .track-row, .artist-row { display: flex; align-items: center; gap: 12px; padding: 9px 20px; transition: background 0.1s; }
        .track-row:hover, .artist-row:hover { background: var(--surface2); }
        .track-num { font-size: 12px; color: var(--dim); width: 18px; text-align: center; font-variant-numeric: tabular-nums; flex-shrink: 0; }
        .track-art, .artist-img { object-fit: cover; flex-shrink: 0; background: var(--surface2); }
        .track-art { width: 38px; height: 38px; border-radius: 4px; }
        .artist-img { width: 40px; height: 40px; border-radius: 50%; }
        .track-info, .artist-info { flex: 1; min-width: 0; }
        .track-name, .artist-name { font-size: 13px; font-weight: 500; color: var(--white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
        .track-artist, .artist-genres { font-size: 12px; color: var(--dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .track-duration, .artist-rank { font-size: 12px; color: var(--dim); flex-shrink: 0; font-variant-numeric: tabular-nums; }

        .recent-list { padding: 6px 0; }
        .recent-row { display: flex; gap: 12px; padding: 9px 20px; align-items: center; transition: background 0.1s; }
        .recent-row:hover { background: var(--surface2); }
        .recent-art, .recent-art-placeholder { width: 36px; height: 36px; border-radius: 4px; object-fit: cover; flex-shrink: 0; background: var(--surface2); }
        .recent-info { flex: 1; min-width: 0; }
        .recent-name { font-size: 12px; font-weight: 500; color: var(--white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
        .recent-artist { font-size: 11px; color: var(--dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .recent-time { font-size: 11px; color: var(--dim); flex-shrink: 0; }

        .card-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--white); margin-bottom: 12px; }
        .empty { padding: 32px 20px; text-align: center; color: var(--dim); font-size: 13px; }

        @media (max-width: 768px) {
          .dash { padding: 0 14px 40px; }
          .now-playing { gap: 14px; padding: 16px; }
          .np-art, .np-art-placeholder { width: 56px; height: 56px; }
          .np-track { font-size: 15px; }
          .np-duration { display: none; }
          .dash-grid { grid-template-columns: 1fr; }
          .personality-card { flex-direction: column; align-items: flex-start; gap: 10px; }
          .share-row { flex-direction: column; }
          .share-input-wrap { min-width: 0; }
          .stats-grid { grid-template-columns: 1fr; }
          .share-link-row { flex-wrap: wrap; justify-content: center; }
        }
      `}</style>

      {loading ? (
        <div className="loader">
          <div className="loader-ring" />
          <p className="loader-text">Loading your stats…</p>
        </div>
      ) : (
        <div className="dash">
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

          <div className={`now-playing ${!data?.isPlaying ? 'np-idle' : ''}`}>
            {data?.nowPlaying?.album?.images?.[0]?.url ? (
              <img className="np-art" src={data.nowPlaying.album.images[0].url} alt="Album art" />
            ) : (
              <div className="np-art-placeholder"><Icon.music style={{ width: 24, height: 24 }} /></div>
            )}
            <div className="np-info">
              <div className={`np-label ${data?.isPlaying ? 'live' : ''}`}>
                {data?.isPlaying ? <><span className="np-dot" /> Now Playing</> : 'Last Played'}
              </div>
              <div className="np-track">
                {data?.nowPlaying?.name || 'Nothing playing right now'}
              </div>
              {data?.nowPlaying && (
                <div className="np-artist">
                  {data.nowPlaying.artists?.map(a => a.name).join(', ')}
                  <span style={{ color: 'var(--dim)', margin: '0 6px' }}>·</span>
                  {data.nowPlaying.album?.name}
                </div>
              )}
            </div>
            {data?.nowPlaying?.duration_ms && (
              <span className="np-duration">{msToTime(data.nowPlaying.duration_ms)}</span>
            )}
          </div>

          {personality && (
            <div className="personality-card">
              <div>
                <div className="p-label">Top Genre Profile</div>
                <div className="p-name">{personality}</div>
              </div>
              {data?.topGenres?.length > 0 && (
                <div className="p-genres">
                  {data.topGenres.map(g => (
                    <span className="p-genre" key={g}>{g}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="share-card">
            <div className="share-head">
              <Icon.link className="icon" />
              <span className="share-title">Create your stats profile</span>
            </div>

            {!savedUsername ? (
              <>
                <p className="share-desc">
                  Pick a name and get a link anyone can open to see your live listening stats — no login needed.
                </p>
                <div className="share-row">
                  <div className="share-input-wrap">
                    <span className="share-prefix">aura.app/u/</span>
                    <input
                      className="share-input"
                      type="text"
                      placeholder="yourname"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      maxLength={24}
                    />
                  </div>
                  <button className="share-btn" onClick={saveUsername} disabled={shareLoading || !username.trim()}>
                    {shareLoading ? 'Creating…' : 'Create link'}
                  </button>
                </div>
                {shareError && <div className="share-error">{shareError}</div>}
              </>
            ) : (
              <div className="share-live">
                <span className="live-badge"><Icon.globe className="icon" style={{ width: 13, height: 13 }} /> Live and public</span>
                <div className="share-link-row">
                  <a className="share-link" href={`/u/${savedUsername}`} target="_blank" rel="noreferrer">
                    {shareUrl || `/u/${savedUsername}`}
                  </a>
                  <button className="icon-btn" onClick={copyLink} title="Copy link">
                    {copied ? <Icon.check className="icon" /> : <Icon.copy className="icon" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              {data?.allTimeFavTrack?.album?.images?.[2]?.url ? (
                <img className="stat-art" src={data.allTimeFavTrack.album.images[2].url} alt={data.allTimeFavTrack.name} />
              ) : (
                <div className="stat-art-placeholder"><Icon.music style={{ width: 18, height: 18 }} /></div>
              )}
              <div className="stat-info">
                <div className="stat-label">All-Time Favorite</div>
                <div className="stat-name">{data?.allTimeFavTrack?.name || 'Not enough data yet'}</div>
                <div className="stat-sub">{data?.allTimeFavTrack?.artists?.map(a => a.name).join(', ') || '—'}</div>
              </div>
            </div>

            <div className="stat-card">
              {data?.allTimeFavArtist?.images?.[2]?.url ? (
                <img className="stat-art" src={data.allTimeFavArtist.images[2].url} alt={data.allTimeFavArtist.name} style={{ borderRadius: '50%' }} />
              ) : (
                <div className="stat-art-placeholder" style={{ borderRadius: '50%' }}><Icon.music style={{ width: 18, height: 18 }} /></div>
              )}
              <div className="stat-info">
                <div className="stat-label">Most Played Artist</div>
                <div className="stat-name">{data?.allTimeFavArtist?.name || 'Not enough data yet'}</div>
                <div className="stat-sub">{data?.allTimeFavArtist?.genres?.slice(0, 2).join(', ') || '—'}</div>
              </div>
            </div>

            <div className="stat-card">
              {data?.oldestRecent?.track?.album?.images?.[2]?.url ? (
                <img className="stat-art" src={data.oldestRecent.track.album.images[2].url} alt={data.oldestRecent.track.name} />
              ) : (
                <div className="stat-art-placeholder"><Icon.music style={{ width: 18, height: 18 }} /></div>
              )}
              <div className="stat-info">
                <div className="stat-label">Earliest in History</div>
                <div className="stat-name">{data?.oldestRecent?.track?.name || 'No history yet'}</div>
                <div className="stat-sub">{data?.oldestRecent ? timeAgo(data.oldestRecent.played_at) : '—'}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-art-placeholder"><Icon.music style={{ width: 18, height: 18 }} /></div>
              <div className="stat-info">
                <div className="stat-label">Recent Listening</div>
                <div className="stat-name">{data?.recentMinutes ?? '—'} minutes</div>
                <div className="stat-sub">across last 50 plays</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-art-placeholder"><Icon.music style={{ width: 18, height: 18 }} /></div>
              <div className="stat-info">
                <div className="stat-label">Taste Profile</div>
                <div className="stat-name">{data?.avgPopularity != null ? `${data.avgPopularity}% mainstream` : '—'}</div>
                <div className="stat-sub">based on top tracks' popularity</div>
              </div>
            </div>
          </div>

          <div className="dash-grid">
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
                        <div className="track-art" />
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
                        <div className="artist-img" />
                      )}
                      <div className="artist-info">
                        <div className="artist-name">{a.name}</div>
                        <div className="artist-genres">{a.genres?.slice(0, 2).join(', ')}</div>
                      </div>
                      <span className="artist-rank">{a.popularity || 0}% pop.</span>
                    </div>
                  )) : <div className="empty">No top artists found yet.</div>}
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header" style={{ paddingBottom: 0 }}>
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
