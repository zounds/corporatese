import { Redis } from "@upstash/redis";

const kv = Redis.fromEnv();

const POOL_KEY = "corporatese:pool";
const MAX_POOL_SIZE = 500;

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const pool = (await kv.get(POOL_KEY)) || [];
      return res.status(200).json({ pool });
    }

    if (req.method === "POST") {
      const newRounds = Array.isArray(req.body?.rounds) ? req.body.rounds : [];
      const existing = (await kv.get(POOL_KEY)) || [];

      const seen = new Set();
      const merged = [...existing, ...newRounds].filter((r) => {
        const key = (r.jargon || "").trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(-MAX_POOL_SIZE);

      await kv.set(POOL_KEY, merged);
      return res.status(200).json({ pool: merged });
    }

    return res.status(405).json({ error: "Metodo non permesso" });
  } catch (err) {
    return res.status(500).json({ error: "Errore database", detail: String(err) });
  }
}
