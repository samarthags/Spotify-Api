import { getAuthUrl } from '../../lib/spotify';

export default function handler(req, res) {
  res.redirect(getAuthUrl());
}
