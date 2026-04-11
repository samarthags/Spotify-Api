import axios from "axios";
import qs from "qs";

export default async function handler(req, res) {
  const code = req.query.code;

  const tokenRes = await axios.post(
    "https://accounts.spotify.com/api/token",
    qs.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.REDIRECT_URI,
    }),
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.SPOTIFY_CLIENT_ID +
              ":" +
              process.env.SPOTIFY_CLIENT_SECRET
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const access_token = tokenRes.data.access_token;

  res.redirect(`/dashboard?token=${access_token}`);
}