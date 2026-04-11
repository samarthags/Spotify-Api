import { getUserData } from '../../lib/spotify';

export default async function handler(req, res) {
  const { access_token } = req.query;
  if (!access_token) return res.status(400).json({ error: 'Missing token' });

  try {
    const data = await getUserData(access_token);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}