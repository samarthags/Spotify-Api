const axios = require("axios");

module.exports = async (req, res) => {
  const token = req.query.access_token;

  try {
    const result = await axios.get("https://api.spotify.com/v1/me/top/tracks?limit=5", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const topTracks = result.data.items.map((track) => ({
      name: track.name,
      artist: track.artists[0].name,
    }));

    res.status(200).json(topTracks);
  } catch (err) {
    console.error("Top tracks API error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch top tracks" });
  }
};