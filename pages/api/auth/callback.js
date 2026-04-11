import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [link, setLink] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) return;

    localStorage.setItem("token", token);

    async function fetchData() {
      const artists = await axios.get(
        "https://api.spotify.com/v1/me/top/artists",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const tracks = await axios.get(
        "https://api.spotify.com/v1/me/top/tracks",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const userData = {
        artists: artists.data.items,
        tracks: tracks.data.items,
      };

      const id = Math.random().toString(36).substring(2, 8);

      await axios.post("/api/save", { id, userData });

      setLink(`${process.env.NEXT_PUBLIC_BASE_URL}/compare?id=${id}`);
    }

    fetchData();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Your Link 👇</h2>
      <input value={link} readOnly style={{ width: "100%" }} />
    </div>
  );
}