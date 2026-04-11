import { useEffect, useState } from "react";
import axios from "axios";
import { matchUsers } from "../lib/match";

export default function Compare() {
  const [result, setResult] = useState(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/api/auth/login";
      return;
    }

    async function run() {
      const res = await axios.get(`/api/get?id=${id}`);
      const user1 = res.data;

      const artists = await axios.get(
        "https://api.spotify.com/v1/me/top/artists",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const tracks = await axios.get(
        "https://api.spotify.com/v1/me/top/tracks",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const user2 = {
        artists: artists.data.items,
        tracks: tracks.data.items,
      };

      const match = matchUsers(user1, user2);
      setResult(match);
    }

    run();
  }, []);

  if (!result) return <p>Matching vibes...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>🎧 Your Music Twin</h1>
      <h2>{result.score}% Match</h2>

      <h3>Common Artists:</h3>
      {result.commonArtists.map((a, i) => (
        <p key={i}>{a}</p>
      ))}
    </div>
  );
}