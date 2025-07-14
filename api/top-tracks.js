import axios from "axios";

export default async function handler(req, res) {
  const token = req.headers.authorization;
  try {
    const response = await axios.get("https://api.spotify.com/v1/me/top/tracks?limit=5", {
      headers: { Authorization: `Bearer ${token}` }
    });
    res.status(200).json(response.data);
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
}