import Head from 'next/head';
import { useEffect, useState, useCallback, useRef } from 'react';
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
  'pop': 'Pop', 'hip hop': 'Hip-Hop', 'rap': 'Rap', 'indie': 'Indie',
  'electronic': 'Electronic', 'rock': 'Rock', 'r&b': 'R&B', 'soul': 'Soul',
  'jazz': 'Jazz', 'classical': 'Classical', 'metal': 'Metal',
  'country': 'Country', 'latin': 'Latin', 'k-pop': 'K-Pop',
};

function getPersonality(genres) {
  for (const genre of (genres || [])) {
    for (const [key, val] of Object.entries(GENRE_LABELS)) {
      if (genre.toLowerCase().includes(key)) return `${val} Listener`;
    }
  }
  return 'Musical Explorer';
}

// Blend-style duotone palettes, picked deterministically from the username
// so each profile gets a stable, distinct two-tone identity.
const DUOTONES = [
  ['#1DB954', '#0a3d23'], ['#8B5CF6', '#2a1454'], ['#EC4899', '#4a1233'],
  ['#F59E0B', '#4a2e05'], ['#3B82F6', '#0f2452'], ['#EF4444', '#451010'],
  ['#14B8A6', '#0a3e38'], ['#F97316', '#4a2208'],
];
function pickDuotone(seed) {
  let hash = 0;
  for (let i = 0; i < (seed || '').length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return DUOTONES[Math.abs(hash) % DUOTONES.length];
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return '29, 185, 84';
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
}

const Icon = {
  music: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  ),
  alert: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  play: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3" /></svg>
  ),
  pause: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
  ),
  clock: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  spark: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  playlist: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  external: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
};

function WaveBars({ playing }) {
  return (
    <div className={`wave ${playing ? 'playing' : ''}`}>
      {[0, 1, 2, 3, 4].map((i) => <span key={i} style={{ animationDelay: `${i * 0.12}s` }} />)}
    </div>
  );
}

export default function PublicProfile() {
  const router = useRouter();
  const { username } = router.query;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('tracks');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const audioRef = useRef(null);
  const lastPreviewUrl = useRef(null);

  const fetchData = useCallback(async () => {
    if (!username) return;
    try {
      const res = await fetch(`/api/public/${username}`);
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const json = await res.json();
      setData(json);
      setNotFound(false);
    } catch (e) {
      console.error(e);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Try to autoplay the 30s preview with sound when a new preview becomes
  // available. Most browsers block unmuted autoplay without a prior user
  // gesture — if that happens we fall back to a tappable play button.
  useEffect(() => {
    if (!data?.previewUrl || !audioRef.current) return;
    if (lastPreviewUrl.current === data.previewUrl) return;
    lastPreviewUrl.current = data.previewUrl;

    const audio = audioRef.current;
    audio.src = data.previewUrl;
    audio.volume = 0.6;
    audio.play()
      .then(() => { setAudioPlaying(true); setAudioBlocked(false); })
      .catch(() => { setAudioPlaying(false); setAudioBlocked(true); });
  }, [data?.previewUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !data?.previewUrl) return;
    if (audio.paused) {
      audio.play().then(() => { setAudioPlaying(true); setAudioBlocked(false); }).catch(() => {});
    } else {
      audio.pause();
      setAudioPlaying(false);
    }
  };

  const personality = data ? getPersonality(data.topGenres) : null;
  const [accent, accentDark] = pickDuotone(typeof username === 'string' ? username : 'aura');
  const accentRgb = hexToRgb(accent);

  return (
    <>
      <Head>
        <title>{data?.displayName ? `${data.displayName} · Aura` : 'Aura Profile'}</title>
        <meta name="description" content="Live Spotify listening stats — no sign in required." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <audio ref={audioRef} onEnded={() => setAudioPlaying(false)} onPause={() => setAudioPlaying(false)} onPlay={() => setAudioPlaying(true)} loop />

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        :root {
          --bg: #0a0a0a; --surface: #121212; --surface2: #1a1a1a;
          --border: #232323; --green: #1DB954;
          --white: #fff; --muted: #a0a0a0; --dim: #6a6a6a; --text: #e6e6e6;
          --accent: ${accent}; --accent-dark: ${accentDark}; --accent-rgb: ${accentRgb};
        }
        html, body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; min-height: 100vh; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes wavebar { 0%, 100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }
        @keyframes vinylspin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulsering { 0% { box-shadow: 0 0 0 0 rgba(var(--accent-rgb), 0.45); } 100% { box-shadow: 0 0 0 14px rgba(var(--accent-rgb), 0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes heroGradient { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

        .loader, .notfound { display: flex; align-items: center; justify-content: center; min-height: 100vh; flex-direction: column; gap: 16px; text-align: center; padding: 24px; }
        .loader-ring { width: 40px; height: 40px; border: 3px solid var(--surface2); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
        .loader-text, .notfound-sub { font-size: 13px; color: var(--dim); letter-spacing: 0.5px; }
        .notfound-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; color: var(--white); }

        .wrap { max-width: 780px; margin: 0 auto; padding: 0 0 60px; }

        /* DUOTONE HERO — Blend-style, slow animated gradient */
        .hero {
          position: relative; overflow: hidden;
          background: linear-gradient(120deg, var(--accent-dark) 0%, var(--accent) 45%, var(--accent-dark) 100%);
          background-size: 200% 200%;
          animation: heroGradient 10s ease-in-out infinite;
          padding: 48px 24px 64px; margin-bottom: -36px;
        }
        .hero::after {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(circle at 70% 0%, rgba(255,255,255,0.14), transparent 60%);
        }
        .hero-inner { position: relative; max-width: 780px; margin: 0 auto; animation: fadeUp 0.5s ease-out; }
        .hero-tag { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.75); font-weight: 700; margin-bottom: 16px; }
        .hero-head { display: flex; align-items: center; gap: 16px; }
        .p-avatar, .p-avatar-placeholder { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; background: rgba(0,0,0,0.3); flex-shrink: 0; border: 2px solid rgba(255,255,255,0.3); }
        .p-avatar-placeholder { display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; color: #fff; }
        .p-name { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #fff; letter-spacing: -0.5px; line-height: 1.1; }
        .p-personality { font-size: 13px; color: rgba(255,255,255,0.8); margin-top: 4px; font-weight: 500; }

        /* NOW PLAYING — floats over hero/body seam */
        .now-playing-wrap { padding: 0 20px; position: relative; z-index: 2; animation: fadeUp 0.5s ease-out 0.1s backwards; }
        .now-playing {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 18px 20px; display: flex; align-items: center; gap: 16px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.5);
        }
        .np-art-wrap { position: relative; flex-shrink: 0; width: 64px; height: 64px; }
        .np-art, .np-art-placeholder { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; background: var(--surface2); }
        .np-art-placeholder { display: flex; align-items: center; justify-content: center; color: var(--dim); border-radius: 8px; }
        .np-art.spinning { animation: vinylspin 6s linear infinite; }
        .np-art-wrap.live::before {
          content: ''; position: absolute; inset: -4px; border-radius: 50%;
          animation: pulsering 1.8s ease-out infinite;
        }
        .np-art-hole { position: absolute; top: 50%; left: 50%; width: 10px; height: 10px; border-radius: 50%; background: var(--bg); border: 1px solid rgba(255,255,255,0.15); transform: translate(-50%, -50%); pointer-events: none; }
        .np-info { flex: 1; min-width: 0; }
        .np-label { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--dim); margin-bottom: 6px; display: flex; align-items: center; gap: 6px; font-weight: 600; }
        .np-label.live { color: var(--accent); }
        .np-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); animation: pulsering 1.6s ease-out infinite; }
        .np-track { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 16px; color: var(--white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
        .np-artist { font-size: 13px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .np-idle .np-track { color: var(--muted); font-weight: 600; }

        .play-btn { width: 44px; height: 44px; border-radius: 50%; background: var(--accent); border: none; color: #000; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: transform 0.1s, background 0.15s; }
        .play-btn:hover { transform: scale(1.05); }
        .play-btn:active { transform: scale(0.95); }
        .play-btn svg { width: 18px; height: 18px; }

        .wave { display: flex; align-items: center; gap: 3px; height: 18px; flex-shrink: 0; }
        .wave span { width: 3px; height: 100%; background: var(--accent); border-radius: 2px; transform: scaleY(0.3); opacity: 0.5; }
        .wave.playing span { animation: wavebar 0.9s ease-in-out infinite; opacity: 1; }
        .preview-hint { font-size: 11px; color: var(--dim); text-align: center; margin-top: 8px; }

        .body { padding: 56px 20px 0; }

        /* DAILY PLAYLIST — shimmer + hover lift */
        .daily-card {
          margin-bottom: 16px; border-radius: 14px; padding: 18px; position: relative; overflow: hidden;
          background: linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%);
          border: 1px solid var(--border); display: flex; align-items: center; gap: 16px;
          animation: fadeUp 0.5s ease-out 0.15s backwards;
          transition: transform 0.2s, border-color 0.2s;
        }
        .daily-card:hover { transform: translateY(-2px); border-color: var(--accent); }
        .daily-card::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%);
          background-size: 200% 100%; animation: shimmer 3.5s linear infinite;
        }
        .daily-art-wrap { position: relative; width: 64px; height: 64px; border-radius: 10px; flex-shrink: 0; overflow: hidden; box-shadow: 0 6px 18px rgba(0,0,0,0.4); }
        .daily-art, .daily-art-placeholder { width: 100%; height: 100%; object-fit: cover; background: var(--accent); }
        .daily-art-placeholder { display: flex; align-items: center; justify-content: center; color: rgba(0,0,0,0.5); }
        .daily-info { flex: 1; min-width: 0; position: relative; z-index: 1; }
        .daily-label { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--accent); font-weight: 700; margin-bottom: 4px; }
        .daily-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; color: var(--white); margin-bottom: 2px; }
        .daily-sub { font-size: 12px; color: var(--dim); }
        .daily-btn {
          flex-shrink: 0; background: var(--accent); color: #000; border: none; border-radius: 100px;
          padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; text-decoration: none;
          display: inline-flex; align-items: center; gap: 6px; position: relative; z-index: 1;
          transition: transform 0.1s, background 0.15s;
        }
        .daily-btn:hover { transform: scale(1.04); }
        .daily-btn:active { transform: scale(0.96); }

        /* STAT GRID — Blend-style big tiles */
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px; }
        .stat-tile {
          background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
          padding: 18px; position: relative; overflow: hidden;
          animation: fadeUp 0.5s ease-out backwards;
          transition: transform 0.2s, border-color 0.2s;
        }
        .stat-tile:hover { transform: translateY(-3px); border-color: var(--accent); }
        .stat-tile.wide { grid-column: 1 / -1; display: flex; align-items: center; gap: 14px; }
        .stat-tile-icon { color: var(--accent); margin-bottom: 10px; }
        .stat-tile-label { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--dim); font-weight: 700; margin-bottom: 6px; }
        .stat-tile-value { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--white); line-height: 1.1; }
        .stat-tile-sub { font-size: 12px; color: var(--muted); margin-top: 4px; }
        .stat-art, .stat-art-placeholder { width: 52px; height: 52px; border-radius: 8px; object-fit: cover; flex-shrink: 0; background: var(--surface2); }
        .stat-art-placeholder { display: flex; align-items: center; justify-content: center; color: var(--dim); }
        .stat-tile-name { font-size: 13px; font-weight: 600; color: var(--white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .stat-tile-name-sub { font-size: 12px; color: var(--dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .taste-bar-row { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
        .taste-bar { flex: 1; height: 6px; border-radius: 100px; background: var(--surface2); overflow: hidden; }
        .taste-bar-fill { height: 100%; background: var(--accent); border-radius: 100px; transition: width 0.4s; }
        .taste-label-row { display: flex; justify-content: space-between; font-size: 11px; color: var(--dim); margin-top: 6px; }

        .personality-card {
          margin-bottom: 16px; border-radius: 12px; padding: 16px 20px;
          background: var(--surface); border: 1px solid var(--border);
          animation: fadeUp 0.5s ease-out 0.05s backwards;
        }
        .p-label2 { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--dim); margin-bottom: 10px; font-weight: 600; }
        .p-genres { display: flex; gap: 8px; flex-wrap: wrap; }
        .p-genre { font-size: 11px; padding: 5px 12px; border-radius: 100px; background: var(--surface2); color: var(--white); text-transform: capitalize; border: 1px solid var(--border); }
        .p-genre:first-child { background: var(--accent); color: #000; border-color: var(--accent); font-weight: 700; }

        .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; margin-bottom: 16px; animation: fadeUp 0.5s ease-out 0.2s backwards; }
        .card-header { padding: 16px 20px 0; }
        .tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); }
        .tab { padding: 10px 4px; font-size: 13px; font-weight: 600; color: var(--dim); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; margin-right: 20px; transition: color 0.15s, border-color 0.15s; user-select: none; }
        .tab:hover { color: var(--muted); }
        .tab.active { color: var(--white); border-color: var(--accent); }
        .card-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--white); margin-bottom: 12px; }

        .track-list, .artist-list, .recent-list { padding: 6px 0; }
        .track-row, .artist-row, .recent-row { display: flex; align-items: center; gap: 12px; padding: 9px 20px; transition: background 0.15s, transform 0.15s; }
        .track-row:hover, .artist-row:hover, .recent-row:hover { background: var(--surface2); transform: translateX(3px); }
        .track-num { font-size: 12px; color: var(--dim); width: 18px; text-align: center; font-variant-numeric: tabular-nums; flex-shrink: 0; }
        .track-art, .artist-img, .recent-art, .recent-art-placeholder { object-fit: cover; flex-shrink: 0; background: var(--surface2); }
        .track-art, .recent-art, .recent-art-placeholder { width: 38px; height: 38px; border-radius: 4px; }
        .artist-img { width: 40px; height: 40px; border-radius: 50%; }
        .track-info, .artist-info, .recent-info { flex: 1; min-width: 0; }
        .track-name, .artist-name, .recent-name { font-size: 13px; font-weight: 500; color: var(--white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
        .track-artist, .artist-genres, .recent-artist { font-size: 12px; color: var(--dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .track-duration, .artist-rank, .recent-time { font-size: 12px; color: var(--dim); flex-shrink: 0; font-variant-numeric: tabular-nums; }

        .empty { padding: 32px 20px; text-align: center; color: var(--dim); font-size: 13px; }

        footer { text-align: center; padding: 24px 20px 8px; }
        .footer-text { font-size: 12px; color: var(--dim); }
        .footer-text a { color: var(--accent); text-decoration: none; }

        @media (max-width: 768px) {
          .hero { padding: 36px 16px 56px; }
          .p-avatar, .p-avatar-placeholder { width: 52px; height: 52px; }
          .p-name { font-size: 22px; }
          .now-playing-wrap, .body { padding-left: 14px; padding-right: 14px; }
          .now-playing { padding: 14px 16px; gap: 12px; }
          .np-art-wrap, .np-art, .np-art-placeholder { width: 52px; height: 52px; }
          .stats-grid { grid-template-columns: 1fr; }
          .daily-card { padding: 14px; gap: 12px; }
          .daily-art-wrap { width: 52px; height: 52px; }
          .daily-title { font-size: 14px; }
          .daily-btn { padding: 9px 14px; font-size: 12px; }
        }
      `}</style>

      {loading ? (
        <div className="loader">
          <div className="loader-ring" />
          <p className="loader-text">Loading live stats…</p>
        </div>
      ) : notFound ? (
        <div className="notfound">
          <Icon.alert style={{ width: 32, height: 32, color: 'var(--dim)' }} />
          <div className="notfound-title">Profile not found</div>
          <p className="notfound-sub">This profile doesn&apos;t exist or hasn&apos;t been created yet.</p>
        </div>
      ) : (
        <div className="wrap">
          <div className="hero">
            <div className="hero-inner">
              <div className="hero-tag">Live Spotify Stats</div>
              <div className="hero-head">
                {data?.avatar ? (
                  <img className="p-avatar" src={data.avatar} alt={data.displayName} />
                ) : (
                  <div className="p-avatar-placeholder">{data?.displayName?.[0] || '?'}</div>
                )}
                <div>
                  <div className="p-name">{data?.displayName || 'Listener'}</div>
                  {personality && <div className="p-personality">{personality}</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="now-playing-wrap">
            <div className={`now-playing ${!data?.isPlaying ? 'np-idle' : ''}`}>
              <div className={`np-art-wrap ${data?.isPlaying ? 'live' : ''}`}>
                {data?.nowPlaying?.album?.images?.[0]?.url ? (
                  <img className={`np-art ${audioPlaying ? 'spinning' : ''}`} src={data.nowPlaying.album.images[0].url} alt="Album art" />
                ) : (
                  <div className="np-art-placeholder"><Icon.music style={{ width: 22, height: 22 }} /></div>
                )}
                {audioPlaying && data?.nowPlaying?.album?.images?.[0]?.url && <span className="np-art-hole" />}
              </div>
              <div className="np-info">
                <div className={`np-label ${data?.isPlaying ? 'live' : ''}`}>
                  {data?.isPlaying ? <><span className="np-dot" /> Now Playing</> : 'Last Played'}
                </div>
                <div className="np-track">{data?.nowPlaying?.name || 'Nothing playing right now'}</div>
                {data?.nowPlaying && (
                  <div className="np-artist">{data.nowPlaying.artists?.map(a => a.name).join(', ')}</div>
                )}
              </div>
              {data?.previewUrl ? (
                <>
                  <WaveBars playing={audioPlaying} />
                  <button className="play-btn" onClick={togglePlay} title={audioPlaying ? 'Pause preview' : 'Play preview'}>
                    {audioPlaying ? <Icon.pause /> : <Icon.play />}
                  </button>
                </>
              ) : null}
            </div>
            {data?.previewUrl && audioBlocked && (
              <p className="preview-hint">Tap play to hear a 30s preview</p>
            )}
          </div>

          <div className="body">
            {data?.dailyPlaylist?.url && (
              <div className="daily-card">
                <div className="daily-art-wrap">
                  {data.dailyPlaylist.image ? (
                    <img className="daily-art" src={data.dailyPlaylist.image} alt="Daily playlist cover" />
                  ) : (
                    <div className="daily-art-placeholder"><Icon.playlist style={{ width: 22, height: 22 }} /></div>
                  )}
                </div>
                <div className="daily-info">
                  <div className="daily-label">Updated Today</div>
                  <div className="daily-title">Aura Daily</div>
                  <div className="daily-sub">Top tracks, refreshed every day</div>
                </div>
                <a className="daily-btn" href={data.dailyPlaylist.url} target="_blank" rel="noreferrer">
                  Open <Icon.external style={{ width: 14, height: 14 }} />
                </a>
              </div>
            )}

            {personality && data?.topGenres?.length > 0 && (
              <div className="personality-card">
                <div className="p-label2">Top Genres</div>
                <div className="p-genres">
                  {data.topGenres.map(g => <span className="p-genre" key={g}>{g}</span>)}
                </div>
              </div>
            )}

            <div className="stats-grid">
              <div className="stat-tile" style={{ animationDelay: '0.05s' }}>
                <div className="stat-tile-icon"><Icon.clock style={{ width: 20, height: 20 }} /></div>
                <div className="stat-tile-label">Recent Listening</div>
                <div className="stat-tile-value">{data?.recentMinutes ?? '—'} min</div>
                <div className="stat-tile-sub">across last 50 plays</div>
              </div>

              <div className="stat-tile" style={{ animationDelay: '0.1s' }}>
                <div className="stat-tile-icon"><Icon.spark style={{ width: 20, height: 20 }} /></div>
                <div className="stat-tile-label">Taste Profile</div>
                <div className="stat-tile-value">{data?.avgPopularity != null ? `${data.avgPopularity}%` : '—'}</div>
                <div className="taste-bar-row">
                  <div className="taste-bar"><div className="taste-bar-fill" style={{ width: `${data?.avgPopularity ?? 0}%` }} /></div>
                </div>
                <div className="taste-label-row"><span>Niche</span><span>Mainstream</span></div>
              </div>

              <div className="stat-tile wide" style={{ animationDelay: '0.15s' }}>
                {data?.allTimeFavTrack?.album?.images?.[2]?.url ? (
                  <img className="stat-art" src={data.allTimeFavTrack.album.images[2].url} alt={data.allTimeFavTrack.name} />
                ) : (
                  <div className="stat-art-placeholder"><Icon.music style={{ width: 18, height: 18 }} /></div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="stat-tile-label">All-Time Favorite Track</div>
                  <div className="stat-tile-name">{data?.allTimeFavTrack?.name || 'Not enough data yet'}</div>
                  <div className="stat-tile-name-sub">{data?.allTimeFavTrack?.artists?.map(a => a.name).join(', ') || '—'}</div>
                </div>
              </div>

              <div className="stat-tile wide" style={{ animationDelay: '0.2s' }}>
                {data?.allTimeFavArtist?.images?.[2]?.url ? (
                  <img className="stat-art" src={data.allTimeFavArtist.images[2].url} alt={data.allTimeFavArtist.name} style={{ borderRadius: '50%' }} />
                ) : (
                  <div className="stat-art-placeholder" style={{ borderRadius: '50%' }}><Icon.music style={{ width: 18, height: 18 }} /></div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="stat-tile-label">Most Played Artist (All-Time)</div>
                  <div className="stat-tile-name">{data?.allTimeFavArtist?.name || 'Not enough data yet'}</div>
                  <div className="stat-tile-name-sub">{data?.allTimeFavArtist?.genres?.slice(0, 2).join(', ') || '—'}</div>
                </div>
              </div>

              <div className="stat-tile wide" style={{ animationDelay: '0.25s' }}>
                {data?.oldestRecent?.track?.album?.images?.[2]?.url ? (
                  <img className="stat-art" src={data.oldestRecent.track.album.images[2].url} alt={data.oldestRecent.track.name} />
                ) : (
                  <div className="stat-art-placeholder"><Icon.music style={{ width: 18, height: 18 }} /></div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="stat-tile-label">Earliest in Recent History</div>
                  <div className="stat-tile-name">{data?.oldestRecent?.track?.name || 'No history yet'}</div>
                  <div className="stat-tile-name-sub">{data?.oldestRecent ? timeAgo(data.oldestRecent.played_at) : '—'}</div>
                </div>
              </div>
            </div>

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

            <footer>
              <p className="footer-text">Powered by <a href="/" target="_blank">Aura</a> · Not affiliated with Spotify AB</p>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
