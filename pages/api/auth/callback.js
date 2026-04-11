import { getAccessToken } from '../../../lib/spotify';

export default async function handler(req, res) {
  const { code, state, error } = req.query;
  if (error) return res.redirect(`/?error=${error}`);
  if (!code) return res.redirect('/?error=no_code');

  try {
    const tokenData = await getAccessToken(code);
    if (tokenData.error) return res.redirect(`/?error=${tokenData.error}`);

    const slot = state || 'user1';
    const params = new URLSearchParams({
      slot,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || '',
      expires_in: tokenData.expires_in,
    });
    res.redirect(`/callback?${params.toString()}`);
  } catch (err) {
    res.redirect('/?error=auth_failed');
  }
}