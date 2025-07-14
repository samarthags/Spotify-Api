import axios from "axios";

export default async function handler(req, res) {
  const token = req.headers.authorization;
  try {
    const response = await axios.get("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${token}` }
    });
    res.status(200).json(response.data);
  } catch (err) {
    res.status(204).send();
  }
}