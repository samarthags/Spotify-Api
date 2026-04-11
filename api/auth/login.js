import querystring from "querystring";

export default function handler(req, res) {
  const scope = "user-top-read";

  const query = querystring.stringify({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: process.env.REDIRECT_URI,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${query}`);
}