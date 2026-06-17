import Head from 'next/head';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';

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

// Each profile gets a stable two-tone "aura" derived from its username —
// this is the only accent color used anywhere on the page.
const AURAS = [
  ['#1DB954', '#0a3d23'], ['#8B5CF6', '#2a1454'], ['#EC4899', '#4a1233'],
  ['#F59E0B', '#4a2e05'], ['#3B82F6', '#0f2452'], ['#EF4444', '#451010'],
  ['#14B8A6', '#0a3e38'], ['#F97316', '#4a2208'],
];
function pickAura(seed) {
  let hash = 0;
  for (let i = 0; i < (seed || '').length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AURAS[Math.abs(hash) % AURAS.length];
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
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const audioRef = useRef(null);
  const lastPreviewUrl = useRef(null);

  const fetchData = useCallback(async () => {
    if (!username) return;
    try {
      const res = await fetch(`/api/public/${username}`);
      if (!res.ok) { setNotFound(true); return; }
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

  // Attempt to autoplay the 30s preview with sound when a new preview
  // appears. Browsers usually block unmuted autoplay without a prior
  // gesture — if that happens, fall back to a tappable play button.
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
  const [aura, auraDark] = pickAura(typeof username === 'string' ? username : 'aura');
  const auraRgb = hexToRgb(aura);

  const nowTrack = data?.nowPlaying;
  const nowArt = nowTrack?.album?.images?.[0]?.url;
  const topArtist = data?.topArtists?.[0];
  const topTrack = data?.topTracks?.[0];
  const favTrack = data?.allTimeFavTrack;
  const recent = (data?.recentlyPlayed || []).slice(0, 4);

  const statusText = data?.isPlaying
    ? `Listening to ${nowTrack?.name}`
    : nowTrack
      ? `Last played ${nowTrack?.name}`
      : 'Quiet right now';

  return (
    <>
      <Head>
        <title>{data?.displayName ? `${data.displayName} · Aura` : 'Aura Profile'}</title>
        <meta name="description" content="A live music identity card — no sign-in required." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet" />
      </Head>

      <audio ref={audioRef} onEnded={() => setAudioPlaying(false)} onPause={() => setAudioPlaying(false)} onPlay={() => setAudioPlaying(true)} loop />

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        :root {
          --void: #07070a;
          --ink: #15151b;
          --ink-soft: #1d1d25;
          --line: rgba(255,255,255,0.09);
          --mist: #8c8c98;
          --text: #ece9e6;
          --aura: ${aura};
          --aura-dark: ${auraDark};
          --aura-rgb: ${auraRgb};
        }
        html, body { background: var(--void); color: var(--text); font-family: 'Inter', sans-serif; min-height: 100vh; }
        :focus-visible { outline: 2px solid var(--aura); outline-offset: 3px; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes vinylspin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes wavebar { 0%, 100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes drift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes breatheLive { 0%, 100% { box-shadow: 0 0 0 0 rgba(var(--aura-rgb), 0.55); } 50% { box-shadow: 0 0 0 16px rgba(var(--aura-rgb), 0); } }
        @keyframes breatheIdle { 0%, 100% { box-shadow: 0 0 0 0 rgba(var(--aura-rgb), 0.3); } 50% { box-shadow: 0 0 0 9px rgba(var(--aura-rgb), 0); } }
        @keyframes dotLive { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; }
        }

        .loader, .notfound { display: flex; align-items: center; justify-content: center; min-height: 100vh; flex-direction: column; gap: 16px; text-align: center; padding: 24px; }
        .loader-ring { width: 38px; height: 38px; border: 3px solid var(--ink-soft); border-top-color: var(--aura); border-radius: 50%; animation: spin 0.8s linear infinite; }
        .loader-text, .notfound-sub { font-size: 13px; color: var(--mist); letter-spacing: 0.3px; }
        .notfound-title { font-family: 'Syne', sans-serif; font-size: 21px; font-weight: 800; color: #fff; }

        .page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 28px 18px 48px; }
        .pass { width: 100%; max-width: 420px; }

        /* ---------- HERO / "PASS FRONT" ---------- */
        .hero {
          position: relative; border-radius: 24px; overflow: hidden;
          padding: 40px 24px 34px; text-align: center; isolation: isolate;
          background: linear-gradient(135deg, var(--aura-dark), #000 70%);
          animation: fadeUp 0.5s ease-out;
        }
        .hero-backdrop {
          position: absolute; inset: -10%; z-index: -2;
          background-size: cover; background-position: center;
          filter: blur(34px) saturate(1.3) brightness(0.55);
          transform: scale(1.15);
        }
        .hero-fallback {
          position: absolute; inset: 0; z-index: -2;
          background: linear-gradient(120deg, var(--aura-dark) 0%, var(--aura) 50%, var(--aura-dark) 100%);
          background-size: 200% 200%; animation: drift 9s ease-in-out infinite;
        }
        .hero-veil { position: absolute; inset: 0; z-index: -1; background: radial-gradient(circle at 50% 0%, rgba(0,0,0,0.05), rgba(0,0,0,0.65) 75%); }

        .avatar-wrap { position: relative; width: 84px; height: 84px; margin: 0 auto 18px; }
        .avatar-ring { position: absolute; inset: -6px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.35); }
        .avatar-ring.live { animation: breatheLive 2.2s ease-out infinite; }
        .avatar-ring.idle { animation: breatheIdle 3.6s ease-out infinite; }
        .p-avatar, .p-avatar-placeholder { width: 84px; height: 84px; border-radius: 50%; object-fit: cover; background: rgba(255,255,255,0.08); border: 2px solid rgba(255,255,255,0.5); }
        .p-avatar-placeholder { display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #fff; }

        .p-name { font-family: 'Syne', sans-serif; font-size: 27px; font-weight: 800; color: #fff; letter-spacing: -0.3px; line-height: 1.15; }
        .p-tagline { font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 4px; font-weight: 500; letter-spacing: 0.2px; }

        .status-line { display: inline-flex; align-items: center; gap: 7px; margin-top: 16px; padding: 7px 14px; border-radius: 100px; background: rgba(0,0,0,0.32); border: 1px solid rgba(255,255,255,0.12); max-width: 100%; }
        .status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--aura); flex-shrink: 0; }
        .status-dot.live { animation: dotLive 1.1s ease-in-out infinite; }
        .status-text { font-size: 12px; color: rgba(255,255,255,0.88); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Perforated tear between the pass and the details below */
        .tear { position: relative; height: 18px; margin: 0 4px; }
        .tear::before {
          content: ''; position: absolute; top: 0; left: 14px; right: 14px; height: 0;
          border-top: 1.5px dashed rgba(255,255,255,0.14);
        }
        .tear-dots { position: absolute; top: -10px; left: 0; right: 0; display: flex; justify-content: space-between; padding: 0 2px; }
        .tear-dots span { width: 13px; height: 13px; border-radius: 50%; background: var(--void); }

        /* ---------- BODY WIDGETS ---------- */
        .body { display: flex; flex-direction: column; gap: 12px; margin-top: -2px; }
        .eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 1.4px; text-transform: uppercase; color: var(--mist); font-weight: 600; }
        .eyebrow.aura { color: var(--aura); }

        .card { background: var(--ink); border: 1px solid var(--line); border-radius: 16px; animation: fadeUp 0.5s ease-out backwards; }

        .now-card { display: flex; align-items: center; gap: 14px; padding: 14px; animation-delay: 0.05s; }
        .now-art-wrap { position: relative; width: 60px; height: 60px; flex-shrink: 0; }
        .now-art, .now-art-placeholder { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; background: var(--ink-soft); }
        .now-art-placeholder { display: flex; align-items: center; justify-content: center; color: var(--mist); }
        .now-art.spin { animation: vinylspin 6s linear infinite; }
        .now-hole { position: absolute; top: 50%; left: 50%; width: 9px; height: 9px; border-radius: 50%; background: var(--void); border: 1px solid rgba(255,255,255,0.15); transform: translate(-50%, -50%); }
        .now-info { flex: 1; min-width: 0; }
        .now-track { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 800; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 4px; }
        .now-artist { font-size: 12.5px; color: var(--mist); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
        .now-controls { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .wave { display: flex; align-items: center; gap: 3px; height: 16px; }
        .wave span { width: 3px; height: 100%; background: var(--aura); border-radius: 2px; transform: scaleY(0.3); opacity: 0.5; }
        .wave.playing span { animation: wavebar 0.9s ease-in-out infinite; opacity: 1; }
        .play-btn { width: 38px; height: 38px; border-radius: 50%; background: var(--aura); border: none; color: #000; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.1s; }
        .play-btn:hover { transform: scale(1.06); }
        .play-btn:active { transform: scale(0.94); }
        .play-btn svg { width: 16px; height: 16px; }
        .preview-hint { font-size: 11px; color: var(--mist); text-align: center; margin-top: -4px; }

        .duo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .tile { padding: 16px 14px; text-align: center; animation-delay: 0.1s; transition: transform 0.15s, border-color 0.15s; }
        .tile:hover { transform: translateY(-2px); border-color: var(--aura); }
        .tile-art, .tile-art-placeholder { width: 52px; height: 52px; margin: 10px auto 12px; object-fit: cover; background: var(--ink-soft); }
        .tile-art.round, .tile-art-placeholder.round { border-radius: 50%; }
        .tile-art.square, .tile-art-placeholder.square { border-radius: 10px; }
        .tile-art-placeholder { display: flex; align-items: center; justify-content: center; color: var(--mist); }
        .tile-name { font-family: 'Syne', sans-serif; font-size: 13.5px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tile-sub { font-size: 11.5px; color: var(--mist); margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .row-card { display: flex; align-items: center; gap: 14px; padding: 14px; animation-delay: 0.15s; }
        .row-art, .row-art-placeholder { width: 50px; height: 50px; border-radius: 10px; object-fit: cover; background: var(--ink-soft); flex-shrink: 0; }
        .row-art-placeholder { display: flex; align-items: center; justify-content: center; color: var(--mist); }
        .row-info { flex: 1; min-width: 0; }
        .row-name { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 3px; }
        .row-sub { font-size: 12px; color: var(--mist); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }

        .list-card { padding: 16px 14px 6px; animation-delay: 0.2s; }
        .list-card .eyebrow { padding-left: 2px; }
        .recent-row { display: flex; align-items: center; gap: 11px; padding: 10px 2px; border-top: 1px solid var(--line); }
        .recent-row:first-of-type { border-top: none; margin-top: 10px; }
        .recent-art, .recent-art-placeholder { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; background: var(--ink-soft); flex-shrink: 0; }
        .recent-art-placeholder { display: flex; align-items: center; justify-content: center; color: var(--mist); }
        .recent-info { flex: 1; min-width: 0; }
        .recent-name { font-size: 13px; font-weight: 500; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .recent-artist { font-size: 11.5px; color: var(--mist); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
        .recent-time { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: var(--mist); flex-shrink: 0; }

        .empty-note { font-size: 12px; color: var(--mist); padding: 4px 2px 2px; }

        footer { text-align: center; padding: 18px 4px 4px; }
        .footer-text { font-size: 11.5px; color: var(--mist); }
        .footer-text a { color: var(--aura); text-decoration: none; }

        @media (max-width: 420px) {
          .hero { padding: 34px 18px 28px; }
          .p-name { font-size: 24px; }
        }
      `}</style>

      {loading ? (
        <div className="loader">
          <div className="loader-ring" />
          <p className="loader-text">Loading live stats…</p>
        </div>
      ) : notFound ? (
        <div className="notfound">
          <Icon.alert style={{ width: 30, height: 30, color: 'var(--mist)' }} />
          <div className="notfound-title">Profile not found</div>
          <p className="notfound-sub">This profile doesn&apos;t exist or hasn&apos;t been created yet.</p>
        </div>
      ) : (
        <div className="page">
          <div className="pass">
            <div className="hero">
              {nowArt ? <div className="hero-backdrop" style={{ backgroundImage: `url(${nowArt})` }} /> : <div className="hero-fallback" />}
              <div className="hero-veil" />

              <div className="avatar-wrap">
                <span className={`avatar-ring ${data?.isPlaying ? 'live' : 'idle'}`} />
                {data?.avatar ? (
                  <img className="p-avatar" src={data.avatar} alt={data.displayName} />
                ) : (
                  <div className="p-avatar-placeholder">{data?.displayName?.[0] || '?'}</div>
                )}
              </div>

              <div className="p-name">{data?.displayName || 'Listener'}</div>
              {personality && <div className="p-tagline">{personality}</div>}

              <div className="status-line">
                <span className={`status-dot ${data?.isPlaying ? 'live' : ''}`} />
                <span className="status-text">{statusText}</span>
              </div>
            </div>

            <div className="tear">
              <div className="tear-dots">
                {Array.from({ length: 11 }).map((_, i) => <span key={i} />)}
              </div>
            </div>

            <div className="body">
              {/* Now Playing — the main, featured widget */}
              <div className="card now-card">
                <div className="now-art-wrap">
                  {nowArt ? (
                    <img className={`now-art ${audioPlaying ? 'spin' : ''}`} src={nowArt} alt="Album art" />
                  ) : (
                    <div className="now-art-placeholder"><Icon.music style={{ width: 20, height: 20 }} /></div>
                  )}
                  {audioPlaying && nowArt && <span className="now-hole" />}
                </div>
                <div className="now-info">
                  <span className={`eyebrow ${data?.isPlaying ? 'aura' : ''}`}>{data?.isPlaying ? 'Now Playing' : 'Last Played'}</span>
                  <div className="now-track">{nowTrack?.name || 'Nothing yet'}</div>
                  {nowTrack && <div className="now-artist">{nowTrack.artists?.map(a => a.name).join(', ')}</div>}
                </div>
                {data?.previewUrl && (
                  <div className="now-controls">
                    <WaveBars playing={audioPlaying} />
                    <button className="play-btn" onClick={togglePlay} aria-label={audioPlaying ? 'Pause preview' : 'Play preview'}>
                      {audioPlaying ? <Icon.pause /> : <Icon.play />}
                    </button>
                  </div>
                )}
              </div>
              {data?.previewUrl && audioBlocked && <p className="preview-hint">Tap play to hear a 30s preview</p>}

              {/* Top Artist + Top Track this month */}
              <div className="duo-grid">
                <div className="card tile">
                  <span className="eyebrow">This Month</span>
                  {topArtist?.images?.[2]?.url ? (
                    <img className="tile-art round" src={topArtist.images[2].url} alt={topArtist.name} />
                  ) : (
                    <div className="tile-art-placeholder round"><Icon.music style={{ width: 16, height: 16 }} /></div>
                  )}
                  <div className="tile-name">{topArtist?.name || 'Not enough data'}</div>
                  <div className="tile-sub">Top Artist</div>
                </div>
                <div className="card tile">
                  <span className="eyebrow">This Month</span>
                  {topTrack?.album?.images?.[2]?.url ? (
                    <img className="tile-art square" src={topTrack.album.images[2].url} alt={topTrack.name} />
                  ) : (
                    <div className="tile-art-placeholder square"><Icon.music style={{ width: 16, height: 16 }} /></div>
                  )}
                  <div className="tile-name">{topTrack?.name || 'Not enough data'}</div>
                  <div className="tile-sub">Top Track</div>
                </div>
              </div>

              {/* All-time most played */}
              <div className="card row-card">
                {favTrack?.album?.images?.[2]?.url ? (
                  <img className="row-art" src={favTrack.album.images[2].url} alt={favTrack.name} />
                ) : (
                  <div className="row-art-placeholder"><Icon.music style={{ width: 18, height: 18 }} /></div>
                )}
                <div className="row-info">
                  <span className="eyebrow">All-Time Favorite</span>
                  <div className="row-name">{favTrack?.name || 'Not enough data yet'}</div>
                  <div className="row-sub">{favTrack?.artists?.map(a => a.name).join(', ') || 'Keep listening to unlock this'}</div>
                </div>
              </div>

              {/* Recently played */}
              <div className="card list-card">
                <span className="eyebrow">Recently Played</span>
                {recent.length ? recent.map((item, i) => (
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
                )) : <p className="empty-note">Nothing played recently.</p>}
              </div>

              <footer>
                <p className="footer-text">Powered by <a href="/" target="_blank" rel="noreferrer">Aura</a> · Not affiliated with Spotify AB</p>
              </footer>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
