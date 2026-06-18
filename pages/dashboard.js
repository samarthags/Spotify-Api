import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';

const Icon = {
  music: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  ),
  key: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  ),
  copy: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  check: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  code: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  ),
};

function buildSnippet(apiUrl) {
  return `<p id="now-playing">Loading...</p>

<script>
  const API_URL = "${apiUrl}";

  async function loadStats() {
    const res = await fetch(API_URL);
    const data = await res.json();
    const cp = data.currentlyPlaying;

    document.getElementById("now-playing").textContent = cp.isPlaying
      ? "Currently I'm listening to " + cp.track + " by " + cp.artist
      : "Last played: " + (data.recentlyPlayed ? data.recentlyPlayed.track : "—");
  }

  loadStats();
  setInterval(loadStats, 15000);
</script>`;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      if (res.status === 401) {
        setAuthed(false);
        setLoading(false);
        return;
      }
      const json = await res.json();
      setData(json);
      setAuthed(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const apiUrl = data?.apiId && typeof window !== 'undefined'
    ? `${window.location.origin}/api/v1/stats/${data.apiId}`
    : '';

  const copyText = async (text, which) => {
    await navigator.clipboard.writeText(text);
    if (which === 'url') { setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 1500); }
    else { setCopiedCode(true); setTimeout(() => setCopiedCode(false), 1500); }
  };

  return (
    <>
      <Head>
        <title>Aura — Spotify Stats API</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        :root {
          --bg: #0a0a0a; --surface: #121212; --surface2: #1a1a1a;
          --border: #232323; --green: #1DB954;
          --white: #fff; --muted: #a0a0a0; --dim: #6a6a6a; --text: #e6e6e6;
        }
        html, body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; min-height: 100vh; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

        .loader { display: flex; align-items: center; justify-content: center; min-height: 100vh; flex-direction: column; gap: 16px; }
        .loader-ring { width: 40px; height: 40px; border: 3px solid var(--surface2); border-top-color: var(--green); border-radius: 50%; animation: spin 0.8s linear infinite; }
        .loader-text { font-size: 13px; color: var(--dim); }

        /* LOGIN SCREEN */
        .login-wrap { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px; }
        .login-badge { width: 56px; height: 56px; border-radius: 14px; background: var(--surface); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--green); margin-bottom: 28px; }
        .login-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 32px; color: var(--white); letter-spacing: -1px; margin-bottom: 14px; }
        .login-sub { font-size: 14px; color: var(--muted); max-width: 380px; line-height: 1.6; margin-bottom: 32px; }
        .login-btn {
          display: inline-flex; align-items: center; gap: 10px; background: var(--green); color: #000;
          border: none; cursor: pointer; font-size: 15px; font-weight: 700; padding: 14px 28px;
          border-radius: 100px; text-decoration: none; transition: transform 0.1s, background 0.15s;
        }
        .login-btn:hover { background: #1ed760; transform: translateY(-1px); }

        .dash { max-width: 760px; margin: 0 auto; padding: 0 20px 60px; }
        .dash-nav { display: flex; align-items: center; justify-content: space-between; padding: 20px 0; margin-bottom: 24px; border-bottom: 1px solid var(--border); }
        .dash-logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 18px; color: var(--white); }
        .dash-logo span { color: var(--green); }
        .dash-user { display: flex; align-items: center; gap: 10px; }
        .dash-avatar { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; }
        .dash-avatar-placeholder { width: 30px; height: 30px; border-radius: 50%; background: var(--surface2); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: var(--muted); }
        .dash-username { font-size: 13px; color: var(--white); }
        .btn-logout { font-size: 12px; color: var(--dim); text-decoration: none; padding: 6px 14px; border: 1px solid var(--border); border-radius: 6px; }
        .btn-logout:hover { color: var(--white); border-color: var(--muted); }

        /* LIVE PREVIEW */
        .preview-card {
          background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
          padding: 18px 20px; display: flex; align-items: center; gap: 16px; margin-bottom: 20px;
          animation: fadeUp 0.4s ease-out;
        }
        .preview-art, .preview-art-placeholder { width: 56px; height: 56px; border-radius: 6px; object-fit: cover; flex-shrink: 0; background: var(--surface2); }
        .preview-art-placeholder { display: flex; align-items: center; justify-content: center; color: var(--dim); }
        .preview-info { flex: 1; min-width: 0; }
        .preview-label { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--dim); font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
        .preview-label.live { color: var(--green); }
        .preview-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); }
        .preview-track { font-weight: 600; font-size: 14px; color: var(--white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .preview-artist { font-size: 12px; color: var(--dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* API KEY SECTION */
        .section-label { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--dim); font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
        .section-label .icon { width: 14px; height: 14px; color: var(--green); }

        .api-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 20px; margin-bottom: 20px; animation: fadeUp 0.4s ease-out 0.05s backwards; }
        .api-url-row { display: flex; gap: 8px; align-items: stretch; margin-bottom: 12px; }
        .api-url-box { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; padding: 12px 14px; font-family: 'JetBrains Mono', monospace; font-size: 12.5px; color: var(--green); overflow-x: auto; white-space: nowrap; }
        .icon-btn { background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; width: 42px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--muted); transition: color 0.15s, border-color 0.15s; }
        .icon-btn:hover { color: var(--white); border-color: var(--muted); }
        .icon-btn .icon { width: 16px; height: 16px; }
        .api-note { font-size: 12px; color: var(--dim); line-height: 1.6; }

        /* CODE BLOCK */
        .code-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; margin-bottom: 20px; animation: fadeUp 0.4s ease-out 0.1s backwards; }
        .code-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--border); }
        .code-title { font-size: 13px; font-weight: 600; color: var(--white); display: flex; align-items: center; gap: 8px; }
        .code-title .icon { width: 15px; height: 15px; color: var(--green); }
        .copy-btn { font-size: 12px; font-weight: 600; color: var(--dim); background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; padding: 7px 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: color 0.15s; }
        .copy-btn:hover { color: var(--white); }
        .copy-btn .icon { width: 13px; height: 13px; }
        pre { margin: 0; padding: 18px; overflow-x: auto; font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.7; color: var(--text); }
        pre .tag { color: #569cd6; } pre .str { color: #ce9178; } pre .com { color: var(--dim); }

        .fields-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 20px; animation: fadeUp 0.4s ease-out 0.15s backwards; }
        .field-row { display: flex; justify-content: space-between; gap: 16px; padding: 9px 0; border-bottom: 1px solid var(--border); font-size: 12.5px; }
        .field-row:last-child { border-bottom: none; }
        .field-name { font-family: 'JetBrains Mono', monospace; color: var(--green); white-space: nowrap; }
        .field-desc { color: var(--dim); text-align: right; }

        @media (max-width: 600px) {
          .dash { padding: 0 14px 40px; }
          .preview-card { padding: 14px 16px; gap: 12px; }
          .api-url-box { font-size: 11px; }
          .field-row { flex-direction: column; gap: 2px; }
          .field-desc { text-align: left; }
        }
      `}</style>

      {loading ? (
        <div className="loader">
          <div className="loader-ring" />
          <p className="loader-text">Loading…</p>
        </div>
      ) : !authed ? (
        <div className="login-wrap">
          <div className="login-badge"><Icon.music style={{ width: 26, height: 26 }} /></div>
          <div className="login-title">Aura</div>
          <p className="login-sub">
            Connect your Spotify account to get a permanent API endpoint for your live listening stats — current track, top tracks, and top artists — ready to fetch from any website.
          </p>
          <a href="/api/login" className="login-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Login with Spotify
          </a>
        </div>
      ) : (
        <div className="dash">
          <nav className="dash-nav">
            <div className="dash-logo">Aura <span>·</span> API</div>
            <div className="dash-user">
              {data?.me?.images?.[0]?.url ? (
                <img className="dash-avatar" src={data.me.images[0].url} alt={data.me.display_name} />
              ) : (
                <div className="dash-avatar-placeholder">{data?.me?.display_name?.[0] || '?'}</div>
              )}
              <span className="dash-username">{data?.me?.display_name || 'Listener'}</span>
              <a href="/api/logout" className="btn-logout">Logout</a>
            </div>
          </nav>

          <div className="preview-card">
            {data?.nowPlaying?.album?.images?.[0]?.url ? (
              <img className="preview-art" src={data.nowPlaying.album.images[0].url} alt="Album art" />
            ) : (
              <div className="preview-art-placeholder"><Icon.music style={{ width: 20, height: 20 }} /></div>
            )}
            <div className="preview-info">
              <div className={`preview-label ${data?.isPlaying ? 'live' : ''}`}>
                {data?.isPlaying ? <><span className="preview-dot" /> Now Playing</> : 'Last Played'}
              </div>
              <div className="preview-track">{data?.nowPlaying?.name || 'Nothing playing right now'}</div>
              {data?.nowPlaying && (
                <div className="preview-artist">{data.nowPlaying.artists?.map(a => a.name).join(', ')}</div>
              )}
            </div>
          </div>

          <div className="section-label"><Icon.key className="icon" /> Your API Endpoint</div>
          <div className="api-card">
            <div className="api-url-row">
              <div className="api-url-box">{apiUrl || 'Generating…'}</div>
              <button className="icon-btn" onClick={() => copyText(apiUrl, 'url')} title="Copy URL">
                {copiedUrl ? <Icon.check className="icon" /> : <Icon.copy className="icon" />}
              </button>
            </div>
            <p className="api-note">
              This URL returns your live Spotify data as JSON — no login or API key header needed by whoever calls it. Anyone with this exact link can read your stats, so only share it where you intend to use it.
            </p>
          </div>

          <div className="section-label"><Icon.code className="icon" style={{ color: 'var(--green)' }} /> Implementation</div>
          <div className="code-card">
            <div className="code-header">
              <span className="code-title"><Icon.code className="icon" /> HTML + JavaScript</span>
              <button className="copy-btn" onClick={() => copyText(buildSnippet(apiUrl), 'code')}>
                {copiedCode ? <Icon.check className="icon" /> : <Icon.copy className="icon" />} {copiedCode ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre>{buildSnippet(apiUrl || 'YOUR_API_URL')}</pre>
          </div>

          <div className="section-label">Response Fields</div>
          <div className="fields-card">
            <div className="field-row"><span className="field-name">currentlyPlaying.track</span><span className="field-desc">Track name, or null</span></div>
            <div className="field-row"><span className="field-name">currentlyPlaying.artist</span><span className="field-desc">Artist name(s)</span></div>
            <div className="field-row"><span className="field-name">currentlyPlaying.albumArt</span><span className="field-desc">Image URL</span></div>
            <div className="field-row"><span className="field-name">currentlyPlaying.isPlaying</span><span className="field-desc">true / false</span></div>
            <div className="field-row"><span className="field-name">recentlyPlayed</span><span className="field-desc">Fallback when nothing's playing</span></div>
            <div className="field-row"><span className="field-name">topTracks</span><span className="field-desc">Array of 5, this month</span></div>
            <div className="field-row"><span className="field-name">topArtists</span><span className="field-desc">Array of 5, this month</span></div>
          </div>
        </div>
      )}
    </>
  );
}
