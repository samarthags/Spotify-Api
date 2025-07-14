export default function handler(req, res) {
  const scope = "user-read-private user-read-email user-top-read user-read-currently-playing";

  const redirect_uri = process.env.REDIRECT_URI;

  console.log("Sending to Spotify login with redirect_uri:", redirect_uri); // Debug line

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri,
  });

  const authURL = "https://accounts.spotify.com/authorize?" + params.toString();
  res.redirect(authURL);
}