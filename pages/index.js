import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <Head>
        <title>Aura — Your Spotify Universe</title>
        <meta name="description" content="Discover your music personality, top tracks, and artists in a beautiful Spotify dashboard." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #080808;
          --surface: #111111;
          --surface2: #1a1a1a;
          --green: #1DB954;
          --green-dim: rgba(29, 185, 84, 0.15);
          --green-glow: rgba(29, 185, 84, 0.4);
          --white: #ffffff;
          --muted: #666;
          --text: #e8e8e8;
        }

        html, body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; min-height: 100vh; overflow-x: hidden; }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(1deg); }
          66% { transform: translateY(-10px) rotate(-1deg); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes slide-up {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bar {
          0%, 100% { height: 8px; }
          50% { height: 28px; }
        }

        .page { min-height: 100vh; display: flex; flex-direction: column; position: relative; overflow: hidden; }

        .bg-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }
        .orb1 { width: 600px; height: 600px; background: radial-gradient(circle, rgba(29,185,84,0.12) 0%, transparent 70%); top: -200px; left: -200px; }
        .orb2 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(29,185,84,0.08) 0%, transparent 70%); bottom: 0; right: -100px; }

        nav {
          position: relative; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          padding: 28px 48px;
        }
        .logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px; letter-spacing: -0.5px; color: var(--white); display: flex; align-items: center; gap: 10px; }
        .logo-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); box-shadow: 0 0 12px var(--green); }

        .hero {
          position: relative; z-index: 5;
          flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; padding: 80px 24px 60px;
        }

        .vinyl {
          width: 180px; height: 180px; border-radius: 50%;
          background: conic-gradient(from 0deg, #1a1a1a 0%, #2a2a2a 25%, #111 50%, #222 75%, #1a1a1a 100%);
          position: relative; margin-bottom: 56px;
          animation: float 6s ease-in-out infinite;
          box-shadow: 0 0 60px rgba(29,185,84,0.2), 0 30px 60px rgba(0,0,0,0.6);
        }
        .vinyl::before {
          content: ''; position: absolute; inset: 0; border-radius: 50%;
          background: repeating-radial-gradient(circle at center, transparent 20px, rgba(255,255,255,0.02) 21px, transparent 22px, transparent 28px);
        }
        .vinyl::after {
          content: ''; position: absolute;
          width: 40px; height: 40px; border-radius: 50%;
          background: radial-gradient(circle, var(--green) 30%, #169640);
          top: 50%; left: 50%; transform: translate(-50%, -50%);
          box-shadow: 0 0 20px var(--green-glow);
        }
        .vinyl-ring {
          position: absolute; inset: -20px; border-radius: 50%;
          border: 2px solid rgba(29,185,84,0.3);
          animation: pulse-ring 3s ease-out infinite;
        }
        .vinyl-ring:nth-child(2) { animation-delay: 1s; }
        .vinyl-ring:nth-child(3) { animation-delay: 2s; }

        .eyebrow { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: var(--green); font-weight: 500; margin-bottom: 20px; }

        h1 {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: clamp(48px, 8vw, 96px); line-height: 0.95;
          letter-spacing: -3px; color: var(--white);
          animation: slide-up 0.8s ease forwards;
          margin-bottom: 24px;
        }
        h1 span { color: var(--green); }

        .subtitle {
          font-size: 18px; font-weight: 300; color: var(--muted);
          max-width: 480px; line-height: 1.7;
          animation: slide-up 0.8s 0.1s ease both;
          margin-bottom: 48px;
        }

        .cta-group { display: flex; gap: 16px; align-items: center; animation: slide-up 0.8s 0.2s ease both; }

        .btn-primary {
          display: flex; align-items: center; gap: 10px;
          background: var(--green); color: #000;
          border: none; cursor: pointer;
          font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600;
          padding: 16px 32px; border-radius: 100px;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 0 30px rgba(29,185,84,0.4);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 0 50px rgba(29,185,84,0.6); background: #1ed760; }

        .btn-secondary {
          font-size: 14px; color: var(--muted); text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: all 0.2s;
          padding-bottom: 2px;
        }
        .btn-secondary:hover { color: var(--white); border-color: var(--muted); }

        .features {
          position: relative; z-index: 5;
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1px; background: #1a1a1a;
          border-top: 1px solid #1a1a1a;
          border-bottom: 1px solid #1a1a1a;
        }
        .feature { background: var(--bg); padding: 40px 36px; transition: background 0.3s; }
        .feature:hover { background: var(--surface); }
        .feature-icon { font-size: 28px; margin-bottom: 16px; }
        .feature-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: var(--white); margin-bottom: 8px; }
        .feature-desc { font-size: 14px; color: var(--muted); line-height: 1.6; }

        .bars { display: flex; align-items: flex-end; gap: 3px; height: 32px; }
        .bar { width: 4px; border-radius: 2px; background: var(--green); }
        .bar:nth-child(1) { animation: bar 1.2s 0.0s ease-in-out infinite; }
        .bar:nth-child(2) { animation: bar 1.2s 0.2s ease-in-out infinite; }
        .bar:nth-child(3) { animation: bar 1.2s 0.4s ease-in-out infinite; }
        .bar:nth-child(4) { animation: bar 1.2s 0.1s ease-in-out infinite; }
        .bar:nth-child(5) { animation: bar 1.2s 0.3s ease-in-out infinite; }

        footer { position: relative; z-index: 5; padding: 28px 48px; display: flex; justify-content: space-between; align-items: center; }
        .footer-text { font-size: 12px; color: #333; }
        .footer-text a { color: var(--green); text-decoration: none; }

        @media (max-width: 768px) {
          nav { padding: 20px 24px; }
          .features { grid-template-columns: 1fr; }
          h1 { letter-spacing: -2px; }
          footer { flex-direction: column; gap: 8px; text-align: center; }
        }
      `}</style>

      <div className="page">
        <div className="bg-orb orb1" />
        <div className="bg-orb orb2" />

        <nav>
          <div className="logo">
            <span className="logo-dot" />
            Aura
          </div>
          <div className="bars">
            <div className="bar" />
            <div className="bar" />
            <div className="bar" />
            <div className="bar" />
            <div className="bar" />
          </div>
        </nav>

        <main className="hero">
          <div className="vinyl">
            <div className="vinyl-ring" />
            <div className="vinyl-ring" />
            <div className="vinyl-ring" />
          </div>

          <p className="eyebrow">Spotify Dashboard</p>
          <h1>Your music<br /><span>has an aura.</span></h1>
          <p className="subtitle">
            Visualize your entire Spotify universe — current plays, top tracks, favorite artists, and the genres that define you.
          </p>
          <div className="cta-group">
            <a href="/api/login" className="btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Connect Spotify
            </a>
            <a href="#features" className="btn-secondary">See features →</a>
          </div>
        </main>

        <section className="features" id="features">
          <div className="feature">
            <div className="feature-icon">🎵</div>
            <div className="feature-title">Now Playing</div>
            <div className="feature-desc">See your current track with real-time album art, progress, and audio vibes.</div>
          </div>
          <div className="feature">
            <div className="feature-icon">🏆</div>
            <div className="feature-title">Top Charts</div>
            <div className="feature-desc">Your most played tracks and artists from the last 4 weeks, beautifully ranked.</div>
          </div>
          <div className="feature">
            <div className="feature-icon">🧬</div>
            <div className="feature-title">Music DNA</div>
            <div className="feature-desc">Discover your genre fingerprint and the sonic patterns that make your taste unique.</div>
          </div>
        </section>

        <footer>
          <p className="footer-text">Built by <a href="https://samarthags.in" target="_blank">Samarth AGS</a> · Powered by Spotify API</p>
          <p className="footer-text">Not affiliated with Spotify AB</p>
        </footer>
      </div>
    </>
  );
}
