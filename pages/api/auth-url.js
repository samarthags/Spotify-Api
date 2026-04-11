import { getAuthUrl } from '../../lib/spotify';

export default function handler(req, res) {
  const { slot } = req.query;
  const url = getAuthUrl(slot || 'user1');
  res.status(200).json({ url });
}