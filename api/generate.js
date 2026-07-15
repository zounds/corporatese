export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non permesso" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Chiave API non configurata sul server" });
  }

  const count = Math.min(Number(req.body?.count) || 4, 8);

  const prompt = `Genera esattamente ${count} frasi in italiano piene di gergo aziendale/anglicismi da ufficio (tipo "schedulare", "brieffare", "allineare", "deliverable", "actionable", "leverage", "sync", ma anche varianti nuove, non ripetere queste esatte). Alcune frasi possono riguardare contesti di produzione alimentare, e-commerce o vendita, non solo ufficio generico.

Per ognuna crea 4 riscritture in italiano:
- una troppo informale o sgrammaticata (etichetta "A")
- una chiara, professionale, senza gergo inutile, naturale (etichetta "B")
- una corretta ma inutilmente gonfiata/burocratica (etichetta "C")
- una "trappola": sembra tradotta ma mantiene ancora gergo nascosto (etichetta "D")

IMPORTANTE: la risposta corretta NON deve essere sempre quella etichettata B. In almeno metà dei casi la migliore è una frase semplice e diretta. Scegli tu quale indice (0,1,2,3) è corretto per ciascuna domanda, variando.

Rispondi SOLO con un JSON valido, nessun testo prima o dopo, in questo formato esatto:
[{"jargon":"...","options":[{"level":"A","text":"...","note":"..."},{"level":"B","text":"...","note":"..."},{"level":"C","text":"...","note":"..."},{"level":"D","text":"...","note":"..."}],"correct":0}]

Il campo "note" è una battuta secca, sarcastica, da massimo 12-14 parole, come un amico stronzo ma simpatico. Vietato il tono da corso di formazione.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: "Errore dal servizio IA", detail: errText });
    }

    const data = await response.json();
    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    if (!Array.isArray(parsed)) return res.status(200).json({ rounds: [] });

    const valid = parsed.filter(
      (r) => r.jargon && Array.isArray(r.options) && r.options.length === 4 && typeof r.correct === "number"
    );
    return res.status(200).json({ rounds: valid });
  } catch (err) {
    return res.status(500).json({ error: "Generazione fallita", detail: String(err) });
  }
}
