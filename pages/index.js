export default function Home() {
  return (
    <div style={{ textAlign: "center", marginTop: "120px" }}>
      <h1>🎧 Find Your Music Twin</h1>
      <button onClick={() => (window.location.href = "/api/auth/login")}>
        Login with Spotify
      </button>
    </div>
  );
}