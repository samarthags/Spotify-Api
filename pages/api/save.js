import { saveData } from "../../lib/store";

export default function handler(req, res) {
  const { id, userData } = req.body;
  saveData(id, userData);
  res.json({ ok: true });
}