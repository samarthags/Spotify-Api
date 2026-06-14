import { getAccessToken } from '../../lib/spotify';

export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect('/?error=access_denied');
  }

  try {
    const tokens = await getAccessToken(code);

    if (tokens.error) {
      return res.redirect('/?error=token_error');
    }

    // Store tokens in cookies (httpOnly for security)
    const cookieOptions = 'Path=/; HttpOnly; SameSite=Lax; Max-Age=3600';
    const secureCookieOptions = process.env.NODE_ENV === 'production'
      ? `${cookieOptions}; Secure`
      : cookieOptions;

    res.setHeader('Set-Cookie', [
      `spotify_access_token=${tokens.access_token}; ${secureCookieOptions}`,
      `spotify_refresh_token=${tokens.refresh_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
    ]);

    res.redirect('/dashboard');
  } catch (err) {
    res.redirect('/?error=server_error');
  }
}
