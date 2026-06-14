import Head from 'next/head';

const Icon = {
  music: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  ),
  trophy: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
    </svg>
  ),
  share: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  ),
};

export default function Home() {
  return (
    <>
      <Head>
        <title>Aura — Your Spotify Stats</title>
        <meta name="description" content="See your top tracks, top artists, and live listening activity. Share a public stats page with anyone — no login required." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0a0a0a; --surface: #121212; --surface2: #1a1a1a;
          --border: #232323; --green: #1DB954;
          --white: #ffffff; --muted: #a0a0a0; --dim: #6a6a6a; --text: #e6e6e6;
        }

        html, body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; min-height: 100vh; }

        .page { min-height: 100vh; display: flex; flex-direction: column; }

        nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 24px 48px; border-bottom: 1px solid var(--border);
        }
        .logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 20px; letter-spacing: -0.4px; color: var(--white); display: flex; align-items: center; gap: 8px; }
        .logo span { color: var(--green); }

        .hero {
          flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; padding: 100px 24px 80px;
        }

        .icon-badge {
          width: 64px; height: 64px; border-radius: 16px;
          background: var(--surface); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          color: var(--green); margin-bottom: 32px;
        }

        .eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase; color: var(--green); font-weight: 600; margin-bottom: 18px; }

        h1 {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: clamp(40px, 7vw, 76px); line-height: 1.05;
          letter-spacing: -2px; color: var(--white);
          margin-bottom: 20px;
        }

        .subtitle {
          font-size: 17px; font-weight: 400; color: var(--muted);
          max-width: 480px; line-height: 1.7;
          margin-bottom: 40px;
        }

        .cta-group { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; justify-content: center; }

        .btn-primary {
          display: flex; align-items: center; gap: 10px;
          background: var(--green); color: #000;
          border: none; cursor: pointer;
          font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 700;
          padding: 14px 28px; border-radius: 100px;
          text-decoration: none;
          transition: background 0.15s, transform 0.15s;
        }
        .btn-primary:hover { background: #1ed760; transform: translateY(-1px); }

        .btn-secondary {
          font-size: 14px; font-weight: 600; color: var(--white); text-decoration: none;
          padding: 14px 28px; border-radius: 100px;
          border: 1px solid var(--border);
          transition: border-color 0.15s;
        }
        .btn-secondary:hover { border-color: var(--muted); }

        .features {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1px; background: var(--border);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .feature { background: var(--bg); padding: 36px 32px; }
        .feature-icon { color: var(--green); margin-bottom: 14px; }
        .feature-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--white); margin-bottom: 8px; }
        .feature-desc { font-size: 13px; color: var(--dim); line-height: 1.6; }

        footer { padding: 24px 48px; display: flex; justify-content: space-between; align-items: center; }
        .footer-text { font-size: 12px; color: var(--dim); }
        .footer-text a { color: var(--green); text-decoration: none; }

        @media (max-width: 768px) {
          nav { padding: 18px 20px; }
          .hero { padding: 64px 20px 56px; }
          .features { grid-template-columns: 1fr; }
          footer { flex-direction: column; gap: 8px; text-align: center; padding: 20px; }
        }
      `}</style>

      <div className="page">
        <nav>
          <div className="logo">
            Aura
          </div>
        </nav>

        <main className="hero">
          <div className="icon-badge">
            <Icon.music style={{ width: 28, height: 28 }} />
          </div>

          <p className="eyebrow">Spotify Stats</p>
          <h1>Your music,<br />on display.</h1>
          <p className="subtitle">
            See your current track, top artists, and listening history in a clean dashboard — then share a live public stats page with anyone, no login required.
          </p>
          <div className="cta-group">
            <a href="/api/login" className="btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Connect Spotify
            </a>
            <a href="#features" className="btn-secondary">See features</a>
          </div>
        </main>

        <section className="features" id="features">
          <div className="feature">
            <div className="feature-icon"><Icon.music style={{ width: 24, height: 24 }} /></div>
            <div className="feature-title">Now Playing</div>
            <div className="feature-desc">See your current track with album art and live status, updating automatically.</div>
          </div>
          <div className="feature">
            <div className="feature-icon"><Icon.trophy style={{ width: 24, height: 24 }} /></div>
            <div className="feature-title">Top Charts</div>
            <div className="feature-desc">Your most played tracks and artists from the last 4 weeks, clearly ranked.</div>
          </div>
          <div className="feature">
            <div className="feature-icon"><Icon.share style={{ width: 24, height: 24 }} /></div>
            <div className="feature-title">Public Sharing</div>
            <div className="feature-desc">Publish a link to your live stats. Anyone can view it instantly — no account needed.</div>
          </div>
        </section>

        <footer>
          <p className="footer-text">Built by <a href="https://samarthags.in" target="_blank" rel="noreferrer">Samarth AGS</a> · Powered by Spotify API</p>
          <p className="footer-text">Not affiliated with Spotify AB</p>
        </footer>
      </div>
    </>
  );
}
