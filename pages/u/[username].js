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
};

export default function PublicProfile() {
  const router = useRouter();
  const { username } = router.query;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('tracks');

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

  const personality = data ? getPersonality(data.topGenres) : null;

  return (
    <>
      <Head>
        <title>{data?.displayName ? `${data.displayName} · Aura` : 'Aura Profile'}</title>
        <meta name="description" content="Live Spotify listening stats — no sign in required." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0a0a0a; --surface: #121212; --surface2: #1a1a1a;
          --border: #232323; --green: #1DB954;
          --white: #fff; --muted: #a0a0a0; --dim: #6a6a6a; --text: #e6e6e6;
        }
        html, body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; min-height: 100vh; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .loader, .notfound { display: flex; align-items: center; justify-content: center; min-height: 100vh; flex-direction: column; gap: 16px; text-align: center; padding: 24px; }
        .loader-ring { width: 40px; height: 40px; border: 3px solid var(--surface2); border-top-color: var(--green); border-radius: 50%; animation: spin 0.8s linear infinite; }
        .loader-text, .notfound-sub { font-size: 13px; color: var(--dim); letter-spacing: 0.5px; }
        .notfound-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; color: var(--white); }

        .wrap { max-width: 760px; margin: 0 auto; padding: 32px 20px 60px; }

        .profile-head { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
        .p-avatar, .p-avatar-placeholder { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; background: var(--surface2); flex-shrink: 0; }
        .p-avatar-placeholder { display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: var(--muted); }
        .p-name { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--white); letter-spacing: -0.3px; }
        .p-tag { font-size: 12px; color: var(--dim); margin-top: 2px; }

        .now-playing {
          margin-bottom: 16px; background: var(--surface); border: 1px solid var(--border);
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
        .p-label2 { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--dim); margin-bottom: 4px; font-weight: 600; }
        .p-pname { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: var(--white); }
        .p-genres { display: flex; gap: 8px; flex-wrap: wrap; }
        .p-genre { font-size: 11px; padding: 4px 10px; border-radius: 100px; background: var(--surface2); color: var(--muted); text-transform: capitalize; border: 1px solid var(--border); }

        .card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 16px; }
        .card-header { padding: 16px 20px 0; }
        .tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); }
        .tab { padding: 10px 4px; font-size: 13px; font-weight: 600; color: var(--dim); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; margin-right: 20px; transition: all 0.15s; }
        .tab:hover { color: var(--muted); }
        .tab.active { color: var(--white); border-color: var(--green); }
        .card-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--white); margin-bottom: 12px; }

        .track-list, .artist-list, .recent-list { padding: 6px 0; }
        .track-row, .artist-row, .recent-row { display: flex; align-items: center; gap: 12px; padding: 9px 20px; transition: background 0.1s; }
        .track-row:hover, .artist-row:hover, .recent-row:hover { background: var(--surface2); }
        .track-num { font-size: 12px; color: var(--dim); width: 18px; text-align: center; font-variant-numeric: tabular-nums; flex-shrink: 0; }
        .track-art, .artist-img, .recent-art, .recent-art-placeholder { object-fit: cover; flex-shrink: 0; background: var(--surface2); }
        .track-art, .recent-art, .recent-art-placeholder { width: 38px; height: 38px; border-radius: 4px; }
        .artist-img { width: 40px; height: 40px; border-radius: 50%; }
        .track-info, .artist-info, .recent-info { flex: 1; min-width: 0; }
        .track-name, .artist-name, .recent-name { font-size: 13px; font-weight: 500; color: var(--white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
        .track-artist, .artist-genres, .recent-artist { font-size: 12px; color: var(--dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .track-duration, .artist-rank, .recent-time { font-size: 12px; color: var(--dim); flex-shrink: 0; font-variant-numeric: tabular-nums; }

        .empty { padding: 32px 20px; text-align: center; color: var(--dim); font-size: 13px; }

        footer { text-align: center; padding-top: 8px; }
        .footer-text { font-size: 12px; color: var(--dim); }
        .footer-text a { color: var(--green); text-decoration: none; }

        @media (max-width: 768px) {
          .wrap { padding: 20px 14px 40px; }
          .now-playing { gap: 14px; padding: 16px; }
          .np-art, .np-art-placeholder { width: 56px; height: 56px; }
          .np-track { font-size: 15px; }
          .np-duration { display: none; }
          .personality-card { flex-direction: column; align-items: flex-start; gap: 10px; }
          .profile-head { gap: 12px; }
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
          <p className="notfound-sub">This profile doesn&apos;t exist or hasn&apos;t been made public yet.</p>
        </div>
      ) : (
        <div className="wrap">
          <div className="profile-head">
            {data?.avatar ? (
              <img className="p-avatar" src={data.avatar} alt={data.displayName} />
            ) : (
              <div className="p-avatar-placeholder">{data?.displayName?.[0] || '?'}</div>
            )}
            <div>
              <div className="p-name">{data?.displayName || 'Listener'}</div>
              <div className="p-tag">Live Spotify stats · updates automatically</div>
            </div>
          </div>

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
                <div className="p-label2">Top Genre Profile</div>
                <div className="p-pname">{personality}</div>
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
      )}
    </>
  );
}
