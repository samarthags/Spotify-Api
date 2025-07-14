const axios = require("axios");

module.exports = async (req, res) => {
  const token = req.query.access_token;

  if (!token) {
    return res.status(400).json({ error: "Missing access_token" });
  }

  try {
    const result = await axios.get("https://api.spotify.com/v1/me/player/recently-played?limit=50", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    let totalMs = 0;
    result.data.items.forEach((item) => {
      totalMs += item.track.duration_ms || 0;
    });

    const totalMinutes = Math.round(totalMs / 1000 / 60);

    res.status(200).json({ totalMinutes }); // ✅ Must be here
  } catch (err) {
    console.error("Recently played error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch recently played tracks" });
  }
};