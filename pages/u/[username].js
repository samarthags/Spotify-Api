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

// Reveals a section with a soft rise-and-fade the first time it scrolls
// into view, instead of everything animating in at once on load.
function useReveal() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold: 0.18 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
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
  play: (p) => (<svg {...p} viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3" /></svg>),
  pause: (p) => (<svg {...p} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>),
  chevron: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>),
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
  const [scrolled, setScrolled] = useState(false);
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

  // Sticky mini-player fades in once the hero has scrolled past.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.55);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    : nowTrack ? `Last played ${nowTrack?.name}` : 'Quiet right now';

  const [nowRef, nowIn] = useReveal();
  const [carouselRef, carouselIn] = useReveal();
  const [favRef, favIn] = useReveal();
  const [recentRef, recentIn] = useReveal();

  return (
    <>
      <Head>
        <title>{data?.displayName ? `${data.displayName} · Aura` : 'Aura Profile'}</title>
        <meta name="description" content="A live music identity card — no sign-in required." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#07070a" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet" />
      </Head>

      <audio ref={audioRef} onEnded={() => setAudioPlaying(false)} onPause={() => setAudioPlaying(false)} onPlay={() => setAudioPlaying(true)} loop />

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        html, body { background: var(--void); overscroll-behavior-y: none; }
        :root {
          --void: #07070a; --ink: #14141b; --ink-soft: #1c1c25; --line: rgba(255,255,255,0.09);
          --mist: #8c8c98; --text: #ece9e6;
          --aura: ${aura}; --aura-dark: ${auraDark}; --aura-rgb: ${auraRgb};
        }
        body { color: var(--text); font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
        :focus-visible { outline: 2px solid var(--aura); outline-offset: 3px; }
        ::-webkit-scrollbar { display: none; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes vinylspin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes wavebar { 0%, 100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }
        @keyframes ambientZoom { 0%, 100% { transform: scale(1.12); } 50% { transform: scale(1.22); } }
        @keyframes breatheLive { 0%, 100% { box-shadow: 0 0 0 0 rgba(var(--aura-rgb), 0.55); } 50% { box-shadow: 0 0 0 16px rgba(var(--aura-rgb), 0); } }
        @keyframes breatheIdle { 0%, 100% { box-shadow: 0 0 0 0 rgba(var(--aura-rgb), 0.3); } 50% { box-shadow: 0 0 0 9px rgba(var(--aura-rgb), 0); } }
        @keyframes dotLive { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes bounceDown { 0%, 100% { transform: translateY(0); opacity: 0.6; } 50% { transform: translateY(6px); opacity: 1; } }
        @keyframes barIn { from { transform: translateY(-100%); } to { transform: translateY(0); } }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; }
        }

        .loader, .notfound { display: flex; align-items: center; justify-content: center; min-height: 100dvh; flex-direction: column; gap: 16px; text-align: center; padding: 24px; background: var(--void); }
        .loader-ring { width: 36px; height: 36px; border: 3px solid var(--ink-soft); border-top-color: var(--aura); border-radius: 50%; animation: spin 0.8s linear infinite; }
        .loader-text, .notfound-sub { font-size: 13px; color: var(--mist); }
        .notfound-title { font-family: 'Syne', sans-serif; font-size: 21px; font-weight: 800; color: #fff; }

        /* ---------- STICKY MINI-PLAYER ---------- */
        .mini-bar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          display: flex; align-items: center; gap: 10px;
          padding: calc(env(safe-area-inset-top, 0px) + 10px) 16px 10px;
          background: rgba(10,10,13,0.7); backdrop-filter: blur(18px) saturate(1.4); -webkit-backdrop-filter: blur(18px) saturate(1.4);
          border-bottom: 1px solid var(--line);
          transform: translateY(-100%); transition: transform 0.35s cubic-bezier(.22,1,.36,1);
        }
        .mini-bar.show { transform: translateY(0); animation: barIn 0.35s cubic-bezier(.22,1,.36,1); }
        .mini-avatar { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; flex-shrink: 0; background: var(--ink-soft); }
        .mini-info { flex: 1; min-width: 0; }
        .mini-name { font-size: 12.5px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mini-status { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--mist); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mini-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--aura); flex-shrink: 0; }
        .mini-dot.live { animation: dotLive 1.1s ease-in-out infinite; }
        .mini-play { width: 32px; height: 32px; border-radius: 50%; background: var(--aura); border: none; color: #000; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform 0.12s; }
        .mini-play:active { transform: scale(0.9); }
        .mini-play svg { width: 13px; height: 13px; }

        /* ---------- HERO ---------- */
        .hero {
          position: relative; min-height: 100dvh; display: flex; flex-direction: column;
          align-items: center; justify-content: center; padding: 24px 22px; text-align: center;
          overflow: hidden; isolation: isolate;
        }
        .hero-backdrop {
          position: absolute; inset: -12%; z-index: -2; background-size: cover; background-position: center;
          filter: blur(38px) saturate(1.35) brightness(0.5);
          animation: ambientZoom 16s ease-in-out infinite;
        }
        .hero-fallback { position: absolute; inset: 0; z-index: -2; background: linear-gradient(150deg, var(--aura-dark) 0%, #050507 60%); }
        .hero-veil { position: absolute; inset: 0; z-index: -1; background: radial-gradient(circle at 50% 18%, rgba(0,0,0,0.05), rgba(2,2,4,0.78) 78%); }

        .avatar-wrap { position: relative; width: 92px; height: 92px; margin-bottom: 20px; }
        .avatar-ring { position: absolute; inset: -6px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.35); }
        .avatar-ring.live { animation: breatheLive 2.2s ease-out infinite; }
        .avatar-ring.idle { animation: breatheIdle 3.6s ease-out infinite; }
        .p-avatar, .p-avatar-placeholder { width: 92px; height: 92px; border-radius: 50%; object-fit: cover; background: rgba(255,255,255,0.08); border: 2px solid rgba(255,255,255,0.5); }
        .p-avatar-placeholder { display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 30px; font-weight: 800; color: #fff; }

        .p-name { font-family: 'Syne', sans-serif; font-size: 30px; font-weight: 800; color: #fff; letter-spacing: -0.4px; line-height: 1.1; }
        .p-tagline { font-size: 12.5px; color: rgba(255,255,255,0.7); margin-top: 5px; font-weight: 500; }

        .status-line { display: inline-flex; align-items: center; gap: 7px; margin-top: 18px; padding: 8px 16px; border-radius: 100px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14); max-width: 100%; }
        .status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--aura); flex-shrink: 0; }
        .status-dot.live { animation: dotLive 1.1s ease-in-out infinite; }
        .status-text { font-size: 12.5px; color: rgba(255,255,255,0.9); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .scroll-cue { position: absolute; bottom: 22px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,0.5); animation: bounceDown 1.8s ease-in-out infinite; }

        /* ---------- SHEET ---------- */
        .sheet {
          position: relative; background: var(--void); border-radius: 26px 26px 0 0;
          margin-top: -26px; padding: 12px 16px calc(env(safe-area-inset-bottom, 0px) + 28px);
          box-shadow: 0 -20px 50px rgba(0,0,0,0.45);
        }
        .grabber { width: 38px; height: 4px; border-radius: 100px; background: rgba(255,255,255,0.18); margin: 0 auto 18px; }

        .reveal { opacity: 0; transform: translateY(18px); transition: opacity 0.55s ease-out, transform 0.55s cubic-bezier(.22,1,.36,1); }
        .reveal.in { opacity: 1; transform: translateY(0); }

        .eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 1.4px; text-transform: uppercase; color: var(--mist); font-weight: 600; }
        .eyebrow.aura { color: var(--aura); }

        .card { background: var(--ink); border: 1px solid var(--line); border-radius: 18px; transition: transform 0.15s, border-color 0.15s, background 0.15s; }
        .card:active { transform: scale(0.985); }

        .now-card { display: flex; align-items: center; gap: 14px; padding: 14px; margin-bottom: 14px; }
        .now-art-wrap { position: relative; width: 62px; height: 62px; flex-shrink: 0; }
        .now-art, .now-art-placeholder { width: 62px; height: 62px; border-radius: 50%; object-fit: cover; background: var(--ink-soft); }
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
        .play-btn { width: 40px; height: 40px; border-radius: 50%; background: var(--aura); border: none; color: #000; display: flex; align-items: center; justify-content: center; transition: transform 0.12s; }
        .play-btn:active { transform: scale(0.9); }
        .play-btn svg { width: 16px; height: 16px; }
        .preview-hint { font-size: 11px; color: var(--mist); text-align: center; margin: -6px 0 14px; }

        /* Swipeable "This Month" carousel */
        .carousel-label { padding: 2px 2px 10px; }
        .carousel { display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 4px; margin-bottom: 14px; -webkit-overflow-scrolling: touch; }
        .carousel-card { scroll-snap-align: start; flex: 0 0 64%; padding: 16px 14px; text-align: center; }
        .tile-art, .tile-art-placeholder { width: 56px; height: 56px; margin: 10px auto 12px; object-fit: cover; background: var(--ink-soft); }
        .tile-art.round, .tile-art-placeholder.round { border-radius: 50%; }
        .tile-art.square, .tile-art-placeholder.square { border-radius: 12px; }
        .tile-art-placeholder { display: flex; align-items: center; justify-content: center; color: var(--mist); }
        .tile-name { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tile-sub { font-size: 11.5px; color: var(--mist); margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .row-card { display: flex; align-items: center; gap: 14px; padding: 14px; margin-bottom: 14px; }
        .row-art, .row-art-placeholder { width: 50px; height: 50px; border-radius: 12px; object-fit: cover; background: var(--ink-soft); flex-shrink: 0; }
        .row-art-placeholder { display: flex; align-items: center; justify-content: center; color: var(--mist); }
        .row-info { flex: 1; min-width: 0; }
        .row-name { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 3px; }
        .row-sub { font-size: 12px; color: var(--mist); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }

        .list-card { padding: 16px 14px 6px; }
        .recent-row { display: flex; align-items: center; gap: 11px; padding: 10px 2px; border-top: 1px solid var(--line); transition: background 0.15s; border-radius: 10px; }
        .recent-row:first-of-type { border-top: none; margin-top: 10px; }
        .recent-row:active { background: var(--ink-soft); }
        .recent-art, .recent-art-placeholder { width: 36px; height: 36px; border-radius: 9px; object-fit: cover; background: var(--ink-soft); flex-shrink: 0; }
        .recent-art-placeholder { display: flex; align-items: center; justify-content: center; color: var(--mist); }
        .recent-info { flex: 1; min-width: 0; }
        .recent-name { font-size: 13px; font-weight: 500; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .recent-artist { font-size: 11.5px; color: var(--mist); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
        .recent-time { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: var(--mist); flex-shrink: 0; }

        .empty-note { font-size: 12px; color: var(--mist); padding: 4px 2px 2px; }
        footer { text-align: center; padding: 20px 4px 4px; }
        .footer-text { font-size: 11.5px; color: var(--mist); }
        .footer-text a { color: var(--aura); text-decoration: none; }

        @media (min-width: 480px) {
          .sheet-inner, .hero-inner { max-width: 440px; margin: 0 auto; }
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
        <>
          <div className={`mini-bar ${scrolled ? 'show' : ''}`}>
            {data?.avatar ? <img className="mini-avatar" src={data.avatar} alt="" /> : <div className="mini-avatar" />}
            <div className="mini-info">
              <div className="mini-name">{data?.displayName}</div>
              <div className="mini-status"><span className={`mini-dot ${data?.isPlaying ? 'live' : ''}`} />{statusText}</div>
            </div>
            {data?.previewUrl && (
              <button className="mini-play" onClick={togglePlay} aria-label={audioPlaying ? 'Pause preview' : 'Play preview'}>
                {audioPlaying ? <Icon.pause /> : <Icon.play />}
              </button>
            )}
          </div>

          <div className="hero">
            {nowArt ? <div className="hero-backdrop" style={{ backgroundImage: `url(${nowArt})` }} /> : <div className="hero-fallback" />}
            <div className="hero-veil" />
            <div className="hero-inner">
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
            <div className="scroll-cue"><Icon.chevron style={{ width: 22, height: 22 }} /></div>
          </div>

          <div className="sheet">
            <div className="grabber" />
            <div className="sheet-inner">
              <div ref={nowRef} className={`reveal ${nowIn ? 'in' : ''}`}>
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
              </div>

              <div ref={carouselRef} className={`reveal ${carouselIn ? 'in' : ''}`}>
                <span className="eyebrow carousel-label">This Month</span>
                <div className="carousel">
                  <div className="card carousel-card">
                    {topArtist?.images?.[2]?.url ? (
                      <img className="tile-art round" src={topArtist.images[2].url} alt={topArtist.name} />
                    ) : (
                      <div className="tile-art-placeholder round"><Icon.music style={{ width: 16, height: 16 }} /></div>
                    )}
                    <div className="tile-name">{topArtist?.name || 'Not enough data'}</div>
                    <div className="tile-sub">Top Artist</div>
                  </div>
                  <div className="card carousel-card">
                    {topTrack?.album?.images?.[2]?.url ? (
                      <img className="tile-art square" src={topTrack.album.images[2].url} alt={topTrack.name} />
                    ) : (
                      <div className="tile-art-placeholder square"><Icon.music style={{ width: 16, height: 16 }} /></div>
                    )}
                    <div className="tile-name">{topTrack?.name || 'Not enough data'}</div>
                    <div className="tile-sub">Top Track</div>
                  </div>
                </div>
              </div>

              <div ref={favRef} className={`reveal ${favIn ? 'in' : ''}`}>
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
              </div>

              <div ref={recentRef} className={`reveal ${recentIn ? 'in' : ''}`}>
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
              </div>

              <footer>
                <p className="footer-text">Powered by <a href="/" target="_blank" rel="noreferrer">Aura</a> · Not affiliated with Spotify AB</p>
              </footer>
            </div>
          </div>
        </>
      )}
    </>
  );
}
