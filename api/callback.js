import axios from "axios";

export default async function handler(req, res) {
  const code = req.query.code;
  const tokenURL = "https://accounts.spotify.com/api/token";

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.REDIRECT_URI
  });

  const basicAuth = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  try {
    const response = await axios.post(tokenURL, body.toString(), {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const { access_token } = response.data;

    // Redirect with access token in query
    res.redirect(`/index.html#access_token=${access_token}`);
  } catch (err) {
    res.status(500).send("Error retrieving access token");
  }
}