const axios = require("axios");

module.exports = async (req, res) => {
  const code = req.query.code;
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirect_uri = process.env.REDIRECT_URI;

  const tokenURL = "https://accounts.spotify.com/api/token";

  const params = new URLSearchParams({
    code,
    redirect_uri,
    grant_type: "authorization_code",
  });

  const headers = {
    Authorization:
      "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
    "Content-Type": "application/x-www-form-urlencoded",
  };

  try {
    const response = await axios.post(tokenURL, params.toString(), {
      headers,
    });

    const access_token = response.data.access_token;

    // Redirect to the frontend with the token in the URL
    res.writeHead(302, {
      Location: `/index.html#access_token=${access_token}`,
    });
    res.end();
  } catch (err) {
    console.error("Error in /api/callback:", err.response?.data || err.message);
    res.status(500).send("OAuth token exchange failed.");
  }
};