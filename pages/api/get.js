import { getData } from "../../lib/store";

export default function handler(req, res) {
  const { id } = req.query;
  res.json(getData(id));
}