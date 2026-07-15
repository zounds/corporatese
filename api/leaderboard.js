import { Redis } from "@upstash/redis";

const kv = Redis.fromEnv();

const BOARD_KEY = "corporatese:leaderboard";
const MAX_ENTRIES = 100;

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const board = (await kv.get(BOARD_KEY)) || [];
      const sorted = [...board].sort((a, b) => b.xp - a.xp).slice(0, 20);
      return res.status(200).json({ leaderboard: sorted });
    }

    if (req.method === "POST") {
      const { name, xp, rank } = req.body || {};
      if (!name || typeof xp !== "number" || !rank) {
        return res.status(400).json({ error: "Dati mancanti" });
      }
      const board = (await kv.get(BOARD_KEY)) || [];
      const updated = [...board, { name: String(name).slice(0, 40), xp, rank, at: Date.now() }]
        .sort((a, b) => b.xp - a.xp)
        .slice(0, MAX_ENTRIES);
      await kv.set(BOARD_KEY, updated);
      return res.status(200).json({ leaderboard: updated.slice(0, 20) });
    }

    return res.status(405).json({ error: "Metodo non permesso" });
  } catch (err) {
    return res.status(500).json({ error: "Errore database", detail: String(err) });
  }
}
