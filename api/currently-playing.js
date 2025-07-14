const axios = require("axios");

module.exports = async (req, res) => {
  const token = req.query.access_token;

  if (!token) {
    return res.status(400).json({ error: "Missing access_token" });
  }

  try {
    const result = await axios.get("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // If no song is currently playing
    if (result.status === 204 || !result.data) {
      return res.status(200).json({ name: null });
    }

    const track = result.data.item;

    res.status(200).json({
      name: track?.name || "Unknown",
      artist: track?.artists?.[0]?.name || "Unknown",
    });
  } catch (err) {
    console.error("Currently playing API error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch currently playing track" });
  }
};