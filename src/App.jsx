import React, { useState, useEffect, useRef } from "react";

// ---- Contenuti del gioco -------------------------------------------------
// Ogni round: una frase "gergo corporate" + 4 riscritture.
// tier: "junior" (senza timer) | "manager" (timer 14s) | "boss" (timer 8s + rischio)
// correct: indice della versione migliore. NON è sempre l'opzione B: nei round
// boss il pattern si rompe apposta, per non far vincere chi ha solo memorizzato.

const ROUNDS = [
  // ---- TIER JUNIOR: si impara il meccanismo, niente timer -----------------
  {
    tier: "junior",
    timer: 18,
    jargon: "Dobbiamo schedulare un call ASAP per allineare sul deliverable.",
    options: [
      { level: "A", text: "Dobbiamo fare una telefonata veloce veloce per dirci le cose.", note: "Sembri un bambino che chiede il gelato." },
      { level: "B", text: "Fissiamo una chiamata a breve per allinearci sul progetto.", note: "Ecco, così. Nessuno è morto." },
      { level: "C", text: "Propongo un breve confronto telefonico nei prossimi giorni per condividere lo stato di avanzamento.", note: "Hai detto la stessa cosa vestendola da smoking." },
      { level: "D", text: "Schedulerei un call ASAP giusto per fare un check veloce sul deliverable.", note: "Stesso identico peccato, solo condizionale." },
    ],
    correct: 1,
  },
  {
    tier: "junior",
    timer: 18,
    jargon: "Ho girato la mail, aspetto un vostro feedback entro EOD.",
    options: [
      { level: "A", text: "Vi ho mandato la mail, ditemi che ne pensate oggi va bene?", note: "Manca solo l'emoji del pollice in su." },
      { level: "B", text: "Vi ho inoltrato la mail: attendo un vostro riscontro entro fine giornata.", note: "Chiaro come l'acqua. Che noia, che bello." },
      { level: "C", text: "Ho provveduto all'inoltro della comunicazione, rimango in attesa di un cortese riscontro entro la giornata odierna.", note: "Ti sei laureato in Burocratese con lode." },
      { level: "D", text: "Ho forwardato la mail, fatemi sapere EOD please.", note: "Metà italiano, metà inglese, tutto imbarazzante." },
    ],
    correct: 1,
  },
  {
    tier: "junior",
    timer: 18,
    jargon: "Bisogna smarcare questo task prima del prossimo standup.",
    options: [
      { level: "A", text: "Dobbiamo finire sta cosa prima della prossima riunione.", note: "'Sta cosa' non è un livello di linguaggio, è una resa." },
      { level: "B", text: "Dobbiamo completare questa attività prima del prossimo incontro di team.", note: "Anche tua nonna capirebbe di cosa parli." },
      { level: "C", text: "È necessario portare a termine l'attività in oggetto in via prioritaria prima del prossimo momento di allineamento.", note: "Hai preso una frase e l'hai fatta ingrassare." },
      { level: "D", text: "Dobbiamo smarcare l'attività prima del prossimo standup di allineamento.", note: "Hai tolto 'task' e ti sei sentito un eroe." },
    ],
    correct: 1,
  },

  // ---- TIER MANAGER: arriva il timer, si stringe il tempo per pensare -----
  {
    tier: "manager",
    timer: 14,
    jargon: "Sto strutturando un piano actionable con i next steps.",
    options: [
      { level: "A", text: "Sto facendo un piano con le cose da fare dopo.", note: "'Le cose da fare dopo' è un post-it, non un piano." },
      { level: "B", text: "Sto definendo un piano concreto con i prossimi passi da seguire.", note: "Zero fuffa, tutto sostanza. Promosso." },
      { level: "C", text: "Sto elaborando una pianificazione strategica orientata all'azione, corredata dai passaggi successivi da intraprendere.", note: "Suona come se dovessi lanciare un razzo, non un piano email." },
      { level: "D", text: "Sto strutturando un piano fattibile con i passi successivi.", note: "Hai tradotto una parola su tre. Impegno parziale, voto parziale." },
    ],
    correct: 1,
  },
  {
    tier: "manager",
    timer: 12,
    jargon: "Voglio del quick feedback prima di deployare in prod.",
    options: [
      { level: "A", text: "Dimmi cosa ne pensi prima che lo mettiamo online va bene?", note: "Frase che finisce con un punto di domanda ma senza punto interrogativo. Coraggioso." },
      { level: "B", text: "Vorrei un riscontro rapido prima di pubblicare in produzione.", note: "Diretto, umano, capibile anche fuori dal reparto tech." },
      { level: "C", text: "Sarebbe opportuno raccogliere un parere preliminare prima di procedere al rilascio nell'ambiente di produzione.", note: "Ci hai messo più parole che secondi ha il quick feedback che chiedevi." },
      { level: "D", text: "Vorrei un feedback veloce prima del deploy in produzione.", note: "Anglicismo a metà: né carne né pesce." },
    ],
    correct: 1,
  },
  {
    tier: "manager",
    timer: 12,
    jargon: "Dobbiamo fare un deep dive sui numbers prima del kickoff.",
    options: [
      { level: "A", text: "Guardiamo bene i numeri prima di iniziare.", note: "Questa è quella giusta. Sorpresa: a volte la più corta vince." },
      { level: "B", text: "Dobbiamo analizzare a fondo i dati prima dell'avvio del progetto.", note: "Corretta ma inutilmente lunga. Ti sei fidato troppo del pattern, eh?" },
      { level: "C", text: "Sarebbe necessario condurre un'analisi approfondita dei dati numerici prima della fase di avvio operativo.", note: "'Dati numerici' come se esistessero dati alfabetici." },
      { level: "D", text: "Facciamo un deep dive sui dati prima del kickoff.", note: "Hai tolto 'numbers' e lasciato il resto del disastro intatto." },
    ],
    correct: 0,
  },

  // ---- TIER BOSS: timer stretto, si può rischiare il doppio ----------------
  {
    tier: "boss",
    timer: 9,
    jargon: "Mi rendo disponibile per un sync veloce se vi fa comodo.",
    options: [
      { level: "A", text: "Se vi va, sentiamoci un attimo.", note: "Questa è quella giusta. Umana, gentile, zero teatro." },
      { level: "B", text: "Sono disponibile per un breve allineamento sincrono, qualora fosse utile.", note: "Ti sei fidato ciecamente della B. Qui è lei la trappola travestita da elegante." },
      { level: "C", text: "Rimango a disposizione per un momento di confronto sincrono, qualora si rendesse necessario ai fini organizzativi.", note: "Livello massimo di fuffologia raggiunto. Complimenti, credo." },
      { level: "D", text: "Mi rendo disponibile per un sync se fa comodo a voi.", note: "Non hai tradotto niente, hai solo cambiato l'ordine delle parole." },
    ],
    correct: 0,
  },
  {
    tier: "boss",
    timer: 8,
    jargon: "Serve un allineamento cross-funzionale per de-riskare la roadmap.",
    options: [
      { level: "A", text: "Dobbiamo parlarne tutti insieme per evitare rischi nel programma.", note: "Chiara ma vaga: chi parla con chi? Bella intenzione, poca sostanza." },
      { level: "B", text: "Serve un confronto tra i team coinvolti per ridurre i rischi sui tempi previsti.", note: "Questa è quella giusta: dice chi, cosa e perché, senza gergo." },
      { level: "C", text: "È opportuno organizzare un momento di sintesi interfunzionale volto alla mitigazione dei rischi strategici di programma.", note: "'Sintesi interfunzionale' potrebbe voler dire tutto o niente, a scelta." },
      { level: "D", text: "Serve un allineamento tra i team per de-riskare la roadmap.", note: "Hai tolto una sola parola e ti sei sentito Cicerone." },
    ],
    correct: 1,
  },
  {
    tier: "boss",
    timer: 7,
    jargon: "Bisogna leveraggiare le sinergie per massimizzare l'impatto sul business.",
    options: [
      { level: "A", text: "Dobbiamo sfruttare meglio quello che già funziona per ottenere risultati migliori.", note: "Questa è quella giusta: dice davvero qualcosa, incredibile." },
      { level: "B", text: "Dobbiamo sfruttare le sinergie per massimizzare l'impatto sul business.", note: "Hai tolto un verbo orrendo e lasciato tre parole che suonano bene e non dicono niente." },
      { level: "C", text: "È fondamentale valorizzare le sinergie esistenti al fine di ottimizzare l'impatto complessivo sul business.", note: "Potrebbe significare qualsiasi cosa, incluso 'buongiorno'." },
      { level: "D", text: "Dobbiamo leveraggiare meglio le sinergie per l'impatto sul business.", note: "Fotocopia dell'originale con un aggettivo in più." },
    ],
    correct: 0,
  },
  {
    tier: "boss",
    timer: 7,
    jargon: "Il framework proprietario che abbiamo sviluppato consente di derisckare l'execution attraverso un approccio data-driven end-to-end.",
    options: [
      { level: "A", text: "Abbiamo un metodo per ridurre gli errori quando mettiamo in pratica le cose, guardando i dati.", note: "Questa è quella giusta. Peccato: detta così la slide costa meno." },
      { level: "B", text: "Usiamo un metodo basato sui dati per ridurre i rischi quando eseguiamo il piano.", note: "Corretta, ma un consulente non fatturerebbe mai una frase così onesta." },
      { level: "C", text: "Il nostro framework consente un approccio strutturato alla mitigazione del rischio esecutivo tramite insight data-driven.", note: "Suona da 15.000 euro più IVA, dice esattamente quanto la A." },
      { level: "D", text: "Il framework consente di derisckare l'execution in modo data-driven.", note: "Hai tolto 'proprietario' e 'end-to-end'. Sconto del 10%, gergo intatto." },
    ],
    correct: 0,
  },
  {
    tier: "boss",
    timer: 6,
    jargon: "Lo stagista ha preparato un deck con 40 slide per sintetizzare il concetto in una frase.",
    options: [
      { level: "A", text: "Uno stagista ha lavorato tutto il weekend per riassumere una cosa semplice in modo complicato.", note: "Questa è quella giusta, e fa anche un po' male." },
      { level: "B", text: "Uno stagista ha impiegato molto tempo a costruire un deck elaborato per una sintesi.", note: "Onesta ma troppo educata. Manca la cattiveria della verità." },
      { level: "C", text: "Una risorsa junior ha prodotto un deliverable articolato di sintesi strategica ad alto valore aggiunto.", note: "'Alto valore aggiunto' per 40 slide che dicono una riga. Fatturato, comunque." },
      { level: "D", text: "Lo stagista ha fatto un deck di 40 slide per sintetizzare un concetto.", note: "Hai solo tolto 'in una frase'. L'ironia se n'è andata con lei." },
    ],
    correct: 0,
  },
];

// ---- Utility: mescola l'ordine di round e opzioni ad ogni partita ---------
// Così non impari mai "la B è sempre giusta" o "la seconda domanda è sempre quella".
function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleOptions(round) {
  const indexed = round.options.map((opt, i) => ({ opt, wasCorrect: i === round.correct }));
  const shuffledOptions = shuffle(indexed);
  const newCorrect = shuffledOptions.findIndex((o) => o.wasCorrect);
  return { ...round, options: shuffledOptions.map((o) => o.opt), correct: newCorrect };
}

// Mescola l'intero pool (scritto a mano + generato al volo) e assegna tier/timer
// in base alla posizione finale, non a un campo fisso: così ogni partita ha
// una curva di difficoltà diversa anche a parità di contenuti.
function buildGameRounds(rawList) {
  const shuffled = shuffle(rawList).map(shuffleOptions);
  const total = shuffled.length;
  return shuffled.map((r, i) => {
    const third = Math.floor((i / total) * 3);
    const tier = third === 0 ? "junior" : third === 1 ? "manager" : "boss";
    const timer =
      tier === "junior" ? 16 + Math.floor(Math.random() * 4)
      : tier === "manager" ? 10 + Math.floor(Math.random() * 5)
      : 6 + Math.floor(Math.random() * 3);
    return { ...r, tier, timer };
  });
}

// Chiede al nostro backend (non più ad Anthropic direttamente) nuove frasi corporate.
// La chiave API resta nascosta sul server: il browser non la vede mai.
async function generateRounds(count = 4) {
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data.rounds) ? data.rounds : [];
  } catch (err) {
    console.error("Generazione domande fallita, uso solo il pool fisso:", err);
    return [];
  }
}



// ---- Mascotte: stagista con lanyard e caffè -------------------------------
function Mascot({ mood = "neutral" }) {
  const mouth =
    mood === "happy" ? (
      <path d="M40 62 Q50 72 60 62" stroke="#241F3D" strokeWidth="3" fill="none" strokeLinecap="round" />
    ) : mood === "sad" ? (
      <path d="M40 68 Q50 60 60 68" stroke="#241F3D" strokeWidth="3" fill="none" strokeLinecap="round" />
    ) : (
      <line x1="40" y1="64" x2="60" y2="64" stroke="#241F3D" strokeWidth="3" strokeLinecap="round" />
    );

  return (
    <svg viewBox="0 0 100 130" className="w-24 h-32 sm:w-28 sm:h-36" role="img" aria-label="Mascotte stagista">
      {/* Blazer oversize */}
      <path d="M20 130 L20 90 Q20 70 50 70 Q80 70 80 90 L80 130 Z" fill="#3B3357" />
      <path d="M50 70 L40 130 M50 70 L60 130" stroke="#2D4A3D" strokeWidth="2" fill="none" />
      {/* Camicia */}
      <path d="M42 75 L50 95 L58 75" fill="#F4EFE6" />
      {/* Lanyard con badge */}
      <path d="M45 76 L38 100 M55 76 L62 100" stroke="#E8A33D" strokeWidth="3" />
      <rect x="42" y="98" width="16" height="20" rx="2" fill="#F5EAD0" stroke="#E8A33D" strokeWidth="2" />
      <text x="50" y="111" fontSize="7" textAnchor="middle" fill="#3B3357" fontFamily="monospace">STAGE</text>
      {/* Testa */}
      <circle cx="50" cy="45" r="28" fill="#E8C39E" />
      {/* Capelli */}
      <path d="M22 42 Q22 16 50 16 Q78 16 78 42 Q70 30 50 30 Q30 30 22 42 Z" fill="#2B2318" />
      {/* Occhi */}
      <circle cx="40" cy="48" r="3" fill="#2D2A26" />
      <circle cx="60" cy="48" r="3" fill="#2D2A26" />
      {/* Bocca */}
      {mouth}
      {/* Guance leggere */}
      <circle cx="32" cy="55" r="4" fill="#C23B3B" opacity="0.15" />
      <circle cx="68" cy="55" r="4" fill="#C23B3B" opacity="0.15" />
      {/* Tazza di caffè in mano */}
      <rect x="72" y="100" width="12" height="14" rx="2" fill="#F5EAD0" stroke="#2B2318" strokeWidth="1.5" />
      <path d="M84 104 Q90 104 90 108 Q90 112 84 111" fill="none" stroke="#2B2318" strokeWidth="1.5" />
    </svg>
  );
}

const LEVEL_COLOR = {
  A: "#C23B3B",
  B: "#241F3D",
  C: "#E8A33D",
  D: "#7A5C9E",
};

// Nessuna classifica finta: ora è vera, caricata da /api/leaderboard (database condiviso).

// ---- Esplosione di particelle sulla risposta: coriandoli se giusto, ------
// scintille rosse e piccolo tremolio dello schermo se sbagliato.
// ---- Motore audio 8-bit: tutto sintetizzato, nessun file esterno ---------
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AC();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playNote(freq, duration = 0.14, type = "square", volume = 0.05, delay = 0) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  } catch (e) {
    // niente audio, pace: il gioco funziona lo stesso
  }
}

function playCorrectSound() {
  playNote(523, 0.1, "square", 0.06, 0);
  playNote(659, 0.1, "square", 0.06, 0.09);
  playNote(784, 0.16, "square", 0.06, 0.18);
}
function playWrongSound() {
  playNote(180, 0.22, "sawtooth", 0.07, 0);
  playNote(120, 0.28, "sawtooth", 0.07, 0.08);
}
function playTickSound() {
  playNote(880, 0.03, "square", 0.02, 0);
}

// Loop musicale ambientale in stile chiptune, quattro note che girano in cerchio
const BG_LOOP_NOTES = [196, 220, 247, 220];
function startBgMusic(intervalRef) {
  let i = 0;
  intervalRef.current = setInterval(() => {
    playNote(BG_LOOP_NOTES[i % BG_LOOP_NOTES.length], 0.22, "triangle", 0.025, 0);
    i += 1;
  }, 420);
}
function stopBgMusic(intervalRef) {
  clearInterval(intervalRef.current);
}

// ---- Oggetti che cadono dal soffitto mentre il tempo scorre --------------
// Faldoni, graffette, tazze di caffè: il caos da ufficio letteralmente addosso.
const CLUTTER_ICONS = ["📎", "📋", "☕", "📠", "🖇️", "📌"];
function FallingClutter({ active }) {
  const [items] = useState(() =>
    Array.from({ length: 7 }, (_, i) => ({
      icon: CLUTTER_ICONS[i % CLUTTER_ICONS.length],
      left: 5 + Math.random() * 90,
      duration: 2.2 + Math.random() * 2,
      delay: Math.random() * 2,
      size: 16 + Math.random() * 14,
    }))
  );
  if (!active) return null;
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 10 }}>
      {items.map((it, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: "-10%",
            left: `${it.left}%`,
            fontSize: it.size,
            animation: `clutter-fall ${it.duration}s linear ${it.delay}s infinite`,
            opacity: 0.85,
          }}
        >
          {it.icon}
        </span>
      ))}
      <style>{`
        @keyframes clutter-fall {
          0% { transform: translateY(-10vh) rotate(0deg); }
          100% { transform: translateY(110vh) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function Burst({ type }) {
  if (!type) return null;
  const colors = type === "correct" ? ["#241F3D", "#E8A33D", "#7A5C9E", "#DCE8D0"] : ["#C23B3B", "#E8A33D"];
  const particles = Array.from({ length: type === "correct" ? 18 : 10 });
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((_, i) => {
        const angle = (Math.PI * 2 * i) / particles.length + Math.random() * 0.4;
        const distance = 120 + Math.random() * 160;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        const color = colors[i % colors.length];
        const size = type === "correct" ? 8 + Math.random() * 6 : 5 + Math.random() * 4;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              top: "35%",
              left: "50%",
              width: size,
              height: size,
              borderRadius: type === "correct" ? "2px" : "50%",
              background: color,
              transform: "translate(-50%, -50%)",
              animation: `burst-fly 700ms ease-out forwards`,
              "--dx": `${dx}px`,
              "--dy": `${dy}px`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes burst-fly {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.3); opacity: 0; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(7px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(4px); }
        }
        .shake-on-wrong { animation: shake 350ms ease-in-out; }
      `}</style>
    </div>
  );
}

// ---- Intro animata: parole gergo che sfrecciano veloci e poi esplodono ---
// nel logo, tipo slot machine che si ferma di colpo sul jackpot.
const INTRO_WORDS = ["Sinergie", "Deliverable", "Actionable", "Allineamento", "Execution", "Empowerment", "Leverage", "KPI"];

// Bottone iniziale: prendiamoci per il culo del milanese aziendale che inglesizza tutto
const START_LABELS = [
  "Lancia sto brief",
  "Pronto a deliverare",
  "Schedula la run",
  "Startup del game",
  "Deliveriamo",
  "Booka la partita",
];

// ---- Loader a schermo intero durante la generazione delle domande --------
const LOADING_MESSAGES = [
  "Sto brifando l'IA...",
  "Allineamento in corso sui deliverable...",
  "Recruiting stagisti per generare gergo fresco...",
  "Sincronizzo con il reparto sinergie...",
  "Schedulo un call con Claude...",
  "Derisckando la roadmap delle domande...",
];
function LoadingOverlay() {
  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1400);
    return () => clearInterval(interval);
  }, []);
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 px-6"
      style={{ background: "#241F3D" }}
    >
      <Mascot mood="neutral" />
      <p className="display text-xs text-center" style={{ color: "#E8A33D", lineHeight: 1.8 }}>
        {LOADING_MESSAGES[msgIndex]}
      </p>
      <div className="w-40 h-2 rounded-full overflow-hidden" style={{ background: "#3B3357" }}>
        <div
          style={{
            width: "40%",
            height: "100%",
            background: "#E8A33D",
            animation: "loading-slide 1.1s ease-in-out infinite",
          }}
        />
      </div>
      <style>{`
        @keyframes loading-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}

function LogoIntro({ onDone }) {
  const [phase, setPhase] = useState("words"); // words | stamp | done
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    let i = 0;
    const wordInterval = setInterval(() => {
      i += 1;
      setWordIndex(i);
      if (i >= INTRO_WORDS.length) {
        clearInterval(wordInterval);
        setPhase("stamp");
        setTimeout(() => {
          setPhase("done");
          onDone();
        }, 750);
      }
    }, 160);
    return () => clearInterval(wordInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
      style={{ background: "#241F3D" }}
      onClick={onDone}
    >
      <style>{`
        @keyframes word-pop {
          0% { transform: scale(0.7) rotate(-4deg); opacity: 0; }
          40% { transform: scale(1.15) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes stamp-in {
          0% { transform: scale(2.5); opacity: 0; }
          60% { transform: scale(0.9); opacity: 1; }
          80% { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
        .word-pop { animation: word-pop 160ms ease-out; }
        .stamp-in { animation: stamp-in 550ms cubic-bezier(.2,1.4,.4,1); }
      `}</style>
      {phase === "words" && (
        <p
          key={wordIndex}
          className="display word-pop font-bold text-center px-6"
          style={{ color: "#E8A33D", fontSize: 22, lineHeight: 1.5 }}
        >
          {INTRO_WORDS[Math.min(wordIndex, INTRO_WORDS.length - 1)]}
        </p>
      )}
      {phase === "stamp" && (
        <div className="stamp-in">
          <Logo />
        </div>
      )}
    </div>
  );
}

// ---- Finale epico: il Cliente-drago è sconfitto, lo stagista alza la ------
// spada, e se ne va con la principessa tra i colleghi in applauso.
function ColleagueClap({ delay }) {
  return (
    <svg viewBox="0 0 24 30" className="w-4 h-5 sm:w-5 sm:h-6" style={{ opacity: 0.55 }}>
      <circle cx="12" cy="6" r="5" fill="#7A5C9E" />
      <rect x="7" y="12" width="10" height="14" rx="2" fill="#7A5C9E" />
      <g style={{ transformOrigin: "12px 13px", animation: `clap 420ms ease-in-out ${delay}s infinite` }}>
        <rect x="2" y="10" width="6" height="3" rx="1.5" fill="#7A5C9E" />
        <rect x="16" y="10" width="6" height="3" rx="1.5" fill="#7A5C9E" />
      </g>
    </svg>
  );
}

function DragonDefeated({ visible }) {
  return (
    <svg
      viewBox="0 0 160 80"
      className="absolute bottom-6 left-1/2"
      style={{
        width: 160,
        transform: "translateX(-50%)",
        opacity: visible ? 1 : 0,
        transition: "opacity 500ms ease",
      }}
    >
      <ellipse cx="80" cy="60" rx="70" ry="14" fill="#241F3D" opacity="0.25" />
      <path d="M10 55 Q40 20 80 40 Q120 20 150 55 Q120 65 80 58 Q40 65 10 55 Z" fill="#3B7A57" />
      <circle cx="30" cy="45" r="6" fill="#3B7A57" />
      <path d="M27 42 L23 36 L31 38 Z" fill="#C23B3B" />
      <line x1="24" y1="47" x2="20" y2="49" stroke="#241F3D" strokeWidth="2" />
      <line x1="24" y1="50" x2="19" y2="53" stroke="#241F3D" strokeWidth="2" />
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          cx={60 + i * 14}
          cy={22}
          r="3"
          fill="#8B8B8B"
          opacity="0.5"
          style={{ animation: `smoke-rise 1.8s ease-out ${i * 0.4}s infinite` }}
        />
      ))}
      <style>{`
        @keyframes smoke-rise {
          0% { transform: translateY(0); opacity: 0.5; }
          100% { transform: translateY(-18px); opacity: 0; }
        }
      `}</style>
    </svg>
  );
}

function VictoryScene() {
  const [phase, setPhase] = useState("dragon"); // dragon | sword | walk

  useEffect(() => {
    playCorrectSound();
    const t1 = setTimeout(() => setPhase("sword"), 1300);
    const t2 = setTimeout(() => setPhase("walk"), 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: 190, background: "linear-gradient(180deg, #3B3357 0%, #241F3D 100%)" }}
    >
      <style>{`
        @keyframes clap {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-18deg); }
        }
        @keyframes sword-raise {
          0% { transform: rotate(0deg) translateY(0); }
          100% { transform: rotate(-25deg) translateY(-6px); }
        }
        @keyframes walk-off {
          0% { transform: translateX(0); }
          100% { transform: translateX(140px); }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

      {/* Colleghi che applaudono sullo sfondo */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-around px-2">
        {[0, 0.1, 0.2, 0.05, 0.15].map((d, i) => (
          <ColleagueClap key={i} delay={d} />
        ))}
      </div>

      <DragonDefeated visible={phase === "dragon"} />

      {(phase === "sword" || phase === "walk") && (
        <div
          className="absolute bottom-6"
          style={{
            left: "50%",
            transform: phase === "walk" ? "translateX(calc(-50% + 60px))" : "translateX(-50%)",
            animation: phase === "walk" ? "walk-off 1.4s ease-in forwards, bob 0.3s ease-in-out infinite" : "bob 0.6s ease-in-out infinite",
            transition: "transform 400ms ease",
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
          }}
        >
          <div style={{ position: "relative" }}>
            <Mascot mood="happy" />
            <div
              style={{
                position: "absolute",
                top: 20,
                right: -6,
                width: 3,
                height: 34,
                background: "#C9A66B",
                transformOrigin: "bottom center",
                animation: "sword-raise 500ms ease-out forwards",
              }}
            >
              <div style={{ position: "absolute", top: -6, left: -3, width: 9, height: 9, background: "#DCE8D0", clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }} />
            </div>
          </div>
          {phase === "walk" && (
            <svg viewBox="0 0 40 70" style={{ width: 34, height: 56 }}>
              <path d="M20 20 L8 65 L32 65 Z" fill="#C23B3B" />
              <circle cx="20" cy="14" r="9" fill="#E8C39E" />
              <path d="M11 12 Q11 2 20 2 Q29 2 29 12 L26 10 Q20 6 14 10 Z" fill="#E8A33D" />
              <polygon points="15,3 17,-3 19,3" fill="#E8A33D" />
              <polygon points="21,3 23,-3 25,3" fill="#E8A33D" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
}

function Logo({ size = "large", theme = "dark" }) {
  const big = size === "large";
  const onLightBg = theme === "light";
  const titleColor = onLightBg ? "#241F3D" : "#F5EAD0";
  const subColor = onLightBg ? "#6E5B3F" : "#C9A66B";
  return (
    <div className="flex flex-col items-center select-none">
      <div className="flex items-center gap-2">
        <span
          className="mono px-2 py-0.5 rounded"
          style={{ background: "#E8A33D", color: "#241F3D", fontSize: big ? 13 : 10, fontWeight: 700 }}
        >
          BETA
        </span>
        <h1
          className="display font-bold tracking-tight"
          style={{ color: titleColor, fontSize: big ? 26 : 14, lineHeight: 1.4 }}
        >
          Corporat<span style={{ color: "#E8A33D" }}>ese</span>
        </h1>
      </div>
      {big && (
        <p
          className="mono tracking-widest uppercase mt-1 text-center max-w-xs"
          style={{ color: subColor, fontSize: 11 }}
        >
          diventa fluente in aziendalese, stupisci tutti in call, poi disimpara tutto
        </p>
      )}
    </div>
  );
}

export default function CorporateseGame() {
  const [screen, setScreen] = useState("cover"); // cover | intro | game | result | leaderboard
  const [round, setRound] = useState(0);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [hasJoinedBoard, setHasJoinedBoard] = useState(false);
  const [fluffCount, setFluffCount] = useState(0); // quante volte scelta l'opzione C (gonfiata)
  const [timeLeft, setTimeLeft] = useState(null);
  const [risked, setRisked] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [gameRounds, setGameRounds] = useState(() => buildGameRounds(ROUNDS));
  const [burst, setBurst] = useState(null); // "correct" | "wrong" | null
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLogoIntro, setShowLogoIntro] = useState(true);
  const [startLabel] = useState(() => START_LABELS[Math.floor(Math.random() * START_LABELS.length)]);
  const intervalRef = useRef(null);
  const musicRef = useRef(null);

  // Musica di sottofondo: parte quando entri in partita, si ferma quando esci
  useEffect(() => {
    if (screen === "game" && !isGenerating) {
      startBgMusic(musicRef);
    } else {
      stopBgMusic(musicRef);
    }
    return () => stopBgMusic(musicRef);
  }, [screen, isGenerating]);

  async function startGame() {
    setIsGenerating(true);
    const ROUNDS_PER_GAME = 12;
    const keyOf = (r) => (r.jargon || "").trim().toLowerCase();

    // Carico il pool condiviso da TUTTI i giocatori (database vero, non solo mio)
    let sharedPool = [];
    try {
      const res = await fetch("/api/pool");
      const data = await res.json();
      sharedPool = Array.isArray(data.pool) ? data.pool : [];
    } catch (e) {
      sharedPool = [];
    }

    const fresh = await generateRounds(6);

    // Se ho generato roba nuova, la mando al backend che la unisce al pool condiviso
    let merged = sharedPool;
    if (fresh.length > 0) {
      try {
        const res = await fetch("/api/pool", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rounds: fresh }),
        });
        const data = await res.json();
        merged = Array.isArray(data.pool) ? data.pool : [...sharedPool, ...fresh];
      } catch (e) {
        merged = [...sharedPool, ...fresh];
      }
    }

    // Pool completo di questa sessione: fisse + tutto il generato da tutti
    const fullPool = [...ROUNDS, ...merged];
    const byKey = new Map(fullPool.map((r) => [keyOf(r), r]));

    // "Mazzo di carte" personale (nel tuo browser): pesco senza reinserire finché
    // non ho visto tutto, solo allora rimescolo. Così la partita 2 non ripete la 1.
    let queue = [];
    try {
      const raw = localStorage.getItem("corporatese-queue");
      queue = raw ? JSON.parse(raw) : [];
    } catch (e) {
      queue = [];
    }
    queue = queue.filter((k) => byKey.has(k));

    while (queue.length < ROUNDS_PER_GAME) {
      const freshShuffle = shuffle([...byKey.keys()]);
      queue = queue.concat(freshShuffle);
    }

    const drawnKeys = queue.slice(0, ROUNDS_PER_GAME);
    const remainingQueue = queue.slice(ROUNDS_PER_GAME);

    try {
      localStorage.setItem("corporatese-queue", JSON.stringify(remainingQueue));
    } catch (e) {
      // se il salvataggio fallisce, la prossima partita semplicemente rimescola tutto da capo
    }

    const selectedRounds = drawnKeys.map((k) => byKey.get(k)).filter(Boolean);
    setGameRounds(buildGameRounds(selectedRounds));

    setIsGenerating(false);
    setRound(0);
    setSelected(null);
    setAnswered(false);
    setScreen("game");
  }

  const current = gameRounds[round];
  const isCorrect = !timedOut && selected === current?.correct;
  const mood = !answered ? "neutral" : isCorrect ? "happy" : "sad";

  // Avvia/reimposta il timer ogni volta che cambia round o si torna alla schermata di gioco
  useEffect(() => {
    clearInterval(intervalRef.current);
    if (screen !== "game" || answered || !current?.timer) {
      setTimeLeft(current?.timer ?? null);
      return;
    }
    setTimeLeft(current.timer);
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          handleTimeout();
          return 0;
        }
        if (t <= 4) playTickSound();
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, screen, answered]);

  function handleTimeout() {
    setTimedOut(true);
    setAnswered(true);
    setSelected(null);
    setStreak(0);
    setBurst("wrong");
    playWrongSound();
  }

  function handleSelect(idx) {
    if (answered) return;
    clearInterval(intervalRef.current);
    setSelected(idx);
    setAnswered(true);
    if (current.options[idx].level === "C") {
      setFluffCount((f) => f + 1);
    }
    const correct = idx === current.correct;
    setBurst(correct ? "correct" : "wrong");
    if (correct) {
      playCorrectSound();
      const base = 10 + streak * 2;
      setXp((x) => x + (risked ? base * 2 : base));
      setStreak((s) => s + 1);
    } else {
      playWrongSound();
      if (risked) setXp((x) => Math.max(0, x - 15));
      setStreak(0);
    }
  }

  function handleNext() {
    setRisked(false);
    setTimedOut(false);
    setBurst(null);
    if (round + 1 >= gameRounds.length) {
      setFinished(true);
      setScreen("result");
      return;
    }
    setRound((r) => r + 1);
    setSelected(null);
    setAnswered(false);
  }

  function handleRestart() {
    setRound(0);
    setXp(0);
    setStreak(0);
    setSelected(null);
    setAnswered(false);
    setFinished(false);
    setHasJoinedBoard(false);
    setFluffCount(0);
    setRisked(false);
    setTimedOut(false);
    setBurst(null);
    setScreen("cover");
  }

  async function fetchLeaderboard() {
    setLeaderboardLoading(true);
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setLeaderboard(Array.isArray(data.leaderboard) ? data.leaderboard : []);
    } catch (e) {
      // se il backend non risponde, la classifica resta vuota, il gioco funziona lo stesso
    }
    setLeaderboardLoading(false);
  }

  async function handleJoinLeaderboard() {
    const name = playerName.trim() || "Anonimo da ufficio";
    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, xp, rank }),
      });
      const data = await res.json();
      setLeaderboard(Array.isArray(data.leaderboard) ? data.leaderboard : []);
    } catch (e) {
      // se il salvataggio fallisce, mostriamo comunque la classifica come l'avevamo caricata
    }
    setHasJoinedBoard(true);
    setScreen("leaderboard");
  }

  const isFluffMaster = fluffCount >= 3;
  const rank = isFluffMaster
    ? "Maestro del Fuffologese"
    : xp >= 45
    ? "Sconfiggi-Cliente"
    : xp >= 25
    ? "Cavaliere di Direzione"
    : xp >= 10
    ? "Scudiero di Reception"
    : "Stagista appena entrato nel castello";

  const fonts = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=IBM+Plex+Mono:wght@500;600&display=swap');
      .display { font-family: 'Press Start 2P', monospace; letter-spacing: 0.02em; }
      .mono { font-family: 'IBM Plex Mono', monospace; }
      body, .min-h-screen { font-family: 'IBM Plex Mono', monospace; }
      /* Estetica pixel: niente angoli tondi da nessuna parte */
      .rounded-xl, .rounded-2xl, .rounded-full, .rounded { border-radius: 0 !important; }
      /* Scanline da vecchio monitor CRT */
      .crt-scanlines::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        background: repeating-linear-gradient(
          0deg,
          rgba(0,0,0,0.12) 0px,
          rgba(0,0,0,0.12) 1px,
          transparent 1px,
          transparent 3px
        );
        z-index: 40;
      }
      @keyframes blink-pixel {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0; }
      }
      .blink { animation: blink-pixel 1s steps(1) infinite; }
    `}</style>
  );

  // Il loader copre qualsiasi schermata mentre generiamo domande nuove
  if (isGenerating) {
    return (
      <>
        {fonts}
        <LoadingOverlay />
      </>
    );
  }

  // ---- COPERTINA ----------------------------------------------------------
  if (screen === "cover") {
    return (
      <div
        className="crt-scanlines min-h-screen w-full flex flex-col items-center py-10 px-6 overflow-y-auto"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(232,163,61,0.18) 0%, transparent 25%),
            radial-gradient(circle at 80% 70%, rgba(232,163,61,0.15) 0%, transparent 22%),
            repeating-linear-gradient(90deg, #241F3D 0px, #241F3D 46px, #2E2650 46px, #2E2650 52px),
            #241F3D
          `,
        }}
      >
        {fonts}
        {showLogoIntro && <LogoIntro onDone={() => setShowLogoIntro(false)} />}
        <div className="flex flex-col items-center gap-6 mt-8">
          <Logo />
          <Mascot mood="happy" />
        </div>
        <div className="flex flex-col items-center gap-4 w-full max-w-xs mt-10 mb-6">
          {!showLogoIntro && (
            <p className="display blink text-xs" style={{ color: "#F5EAD0" }}>
              ▶ SEI PRONTO?
            </p>
          )}
          <button
            onClick={() => setScreen("intro")}
            className="display w-full py-3 rounded-xl text-xs font-bold transition-transform active:scale-95"
            style={{ background: "#E8A33D", color: "#241F3D", border: "3px solid #F5EAD0" }}
          >
            {startLabel}
          </button>
        </div>
      </div>
    );
  }

  // ---- INTRO ----------------------------------------------------------------
  if (screen === "intro") {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center py-10 px-6"
        style={{ background: "#E8DCC0" }}
      >
        {fonts}
        <div className="w-full max-w-md flex flex-col items-center text-center gap-4">
          <Logo size="small" theme="light" />
          <div className="mt-2" style={{ filter: "invert(0)" }}>
            <Mascot mood="neutral" />
          </div>
          <h2 className="display text-base font-bold" style={{ color: "#2B2318", lineHeight: 1.6 }}>
            La chiamata all'avventura
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#2B2318" }}>
            Stagista, manager o direttore: non importa il lanyard che porti al collo, la
            piaga non guarda in faccia nessuno. Oggi attraversi la soglia del castello,
            che il mondo chiama open space, e non tornerai più lo stesso.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#2B2318" }}>
            In fondo al corridoio, oltre l'ultima porta, qualcosa ti aspetta da sempre.
            Nessuno prima di te ci è arrivato lucido. Tu proverai a essere il primo.
          </p>
          <p
            className="text-xs leading-relaxed px-4 py-3 rounded-xl italic"
            style={{ background: "#F5EAD0", border: "1px solid #8B7355", color: "#6E5B3F" }}
          >
            Regola d'oro: se una frase ha bisogno di tre inglesismi per dire "ci sentiamo
            domani", il problema non è la lingua. Sei tu.
          </p>
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Come ti chiami? (per la classifica)"
            className="w-full mt-2 px-4 py-3 rounded-xl text-sm"
            style={{ border: "2px solid #8B7355", background: "#F5EAD0", color: "#2B2318" }}
          />
          <button
            onClick={startGame}
            disabled={isGenerating}
            className="display w-full mt-2 py-3 rounded-xl text-base font-bold transition-transform active:scale-95"
            style={{ background: "#241F3D", color: "#F5EAD0", opacity: isGenerating ? 0.7 : 1 }}
          >
            {isGenerating ? "Sto inventando nuovo gergo..." : "Gioca"}
          </button>
        </div>
      </div>
    );
  }

  // ---- CLASSIFICA -------------------------------------------------------
  if (screen === "leaderboard") {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center py-10 px-6"
        style={{ background: "#E8DCC0" }}
      >
        {fonts}
        <div className="w-full max-w-md">
          <Logo size="small" theme="light" />
          <h2 className="display text-xl font-bold mt-6 mb-4 text-center" style={{ color: "#2B2318" }}>
            Classifica da ufficio
          </h2>
          <div className="flex flex-col gap-2">
            {leaderboardLoading && (
              <p className="text-sm text-center" style={{ color: "#6E5B3F" }}>Carico la classifica...</p>
            )}
            {!leaderboardLoading && leaderboard.length === 0 && (
              <p className="text-sm text-center" style={{ color: "#6E5B3F" }}>
                Ancora nessuno in classifica. Sii il primo eroe del castello.
              </p>
            )}
            {leaderboard.map((entry, idx) => {
              const isMe = hasJoinedBoard && entry.name === (playerName.trim() || "Anonimo da ufficio") && entry.xp === xp;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{
                    background: isMe ? "#DCE8D0" : "#F5EAD0",
                    border: `2px solid ${isMe ? "#241F3D" : "#8B7355"}`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="mono text-sm" style={{ color: "#7A5C9E" }}>#{idx + 1}</span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#2B2318" }}>{entry.name}</p>
                      <p className="text-xs" style={{ color: "#6E5B3F" }}>{entry.rank}</p>
                    </div>
                  </div>
                  <span className="mono text-sm font-bold" style={{ color: "#241F3D" }}>{entry.xp} XP</span>
                </div>
              );
            })}
          </div>
          <button
            onClick={handleRestart}
            className="display w-full mt-6 py-3 rounded-xl text-base font-bold"
            style={{ background: "#241F3D", color: "#F5EAD0" }}
          >
            Rigioca
          </button>
        </div>
      </div>
    );
  }

  // ---- RISULTATO ----------------------------------------------------------
  if (screen === "result") {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center py-10 px-6"
        style={{ background: "#E8DCC0" }}
      >
        {fonts}
        <div className="w-full max-w-md flex flex-col items-center text-center">
          {isFluffMaster ? (
            <Mascot mood="sad" />
          ) : (
            <div className="w-full">
              <VictoryScene />
            </div>
          )}
          <h2 className="display text-2xl font-bold mt-4" style={{ color: "#2B2318" }}>
            Rango: {rank}
          </h2>
          <p className="mono text-sm mt-1" style={{ color: "#6E5B3F" }}>{xp} XP totali</p>
          {isFluffMaster && (
            <p
              className="text-xs leading-relaxed px-4 py-3 rounded-xl italic mt-3"
              style={{ background: "#3A2020", border: "1px solid #C23B3B", color: "#E8A33D" }}
            >
              Hai scelto quasi sempre la frase più lunga e complicata. In consulenza ti pagherebbero
              a parola. In ufficio ti chiamiamo uno che non sa dire le cose semplici.
            </p>
          )}
          {!hasJoinedBoard ? (
            <button
              onClick={handleJoinLeaderboard}
              className="display mt-6 px-6 py-3 rounded-xl text-base font-bold"
              style={{ background: "#E8A33D", color: "#241F3D" }}
            >
              Entra in classifica
            </button>
          ) : (
            <button
              onClick={() => { fetchLeaderboard(); setScreen("leaderboard"); }}
              className="display mt-6 px-6 py-3 rounded-xl text-base font-bold"
              style={{ background: "#E8A33D", color: "#241F3D" }}
            >
              Vedi classifica
            </button>
          )}
          <button
            onClick={handleRestart}
            className="display mt-3 px-6 py-3 rounded-xl text-base font-bold"
            style={{ background: "transparent", color: "#2B2318", border: "2px solid #8B7355" }}
          >
            Rigioca
          </button>
        </div>
      </div>
    );
  }

  // ---- GIOCO ----------------------------------------------------------------
  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center py-8 px-4 ${burst === "wrong" ? "shake-on-wrong" : ""}`}
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        background: `
          radial-gradient(circle at 15% 20%, rgba(232,163,61,0.25) 0%, transparent 22%),
          radial-gradient(circle at 85% 65%, rgba(232,163,61,0.2) 0%, transparent 20%),
          repeating-linear-gradient(90deg, #D8C79E 0px, #D8C79E 38px, #C9B686 38px, #C9B686 44px),
          #E8DCC0
        `,
      }}
    >
      {fonts}
      <Burst type={burst} />
      <FallingClutter active={!answered && current.tier !== "junior"} />

      {/* Top bar: streak + XP */}
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span style={{ color: "#E8A33D" }} className="text-xl">●</span>
          <span className="mono text-sm" style={{ color: "#2B2318" }}>{streak} di fila</span>
        </div>
        <span
          className="mono text-xs px-2 py-1 rounded-full uppercase"
          style={{
            background: current.tier === "boss" ? "#C23B3B" : current.tier === "manager" ? "#E8A33D" : "#7A5C9E",
            color: "#F5EAD0",
          }}
        >
          {current.tier === "boss" ? "⚔ L'ORDALIA: IL CLIENTE" : current.tier === "manager" ? "Prove e Alleati" : "La Soglia"}
        </span>
        <div className="mono text-sm px-3 py-1 rounded-full" style={{ background: "#3B3357", color: "#F5EAD0" }}>
          {xp} XP
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md h-2 rounded-full mb-3" style={{ background: "#8B7355" }}>
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{
            width: `${(Math.min(round, gameRounds.length) / gameRounds.length) * 100}%`,
            background: "#3B3357",
          }}
        />
      </div>

      {/* Timer, solo se il round ne prevede uno */}
      {current.timer && !answered && (
        <div className="w-full max-w-md h-2 rounded-full mb-6 overflow-hidden" style={{ background: "#8B7355" }}>
          <div
            className="h-2 transition-all duration-1000 linear"
            style={{
              width: `${((timeLeft ?? current.timer) / current.timer) * 100}%`,
              background: (timeLeft ?? current.timer) <= 3 ? "#C23B3B" : "#E8A33D",
            }}
          />
        </div>
      )}
      {(!current.timer || answered) && <div className="mb-3" />}

      <div className="w-full max-w-md">
        {/* Mascotte + frase corporate */}
        <div className="flex items-start gap-4 mb-4">
          <Mascot mood={mood} />
          <div
            className="flex-1 rounded-2xl px-4 py-3 relative"
            style={{ background: "#F5EAD0", border: "1px solid #8B7355" }}
          >
            <p className="display text-xs uppercase tracking-wide mb-1" style={{ color: "#7A5C9E" }}>
              Smaschera la frase
            </p>
            <p className="text-base leading-snug" style={{ color: "#2B2318" }}>
              "{current.jargon}"
            </p>
            {timedOut && (
              <p className="text-xs mt-2 font-bold" style={{ color: "#C23B3B" }}>
                Tempo scaduto. Il tuo silenzio è appena diventato un caso studio.
              </p>
            )}
          </div>
        </div>

        {/* Rischia il doppio: solo nello scontro col Cliente, solo prima di rispondere */}
        {current.tier === "boss" && !answered && (
          <button
            onClick={() => setRisked((r) => !r)}
            className="w-full mb-4 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              background: risked ? "#C23B3B" : "transparent",
              color: risked ? "#F5EAD0" : "#C23B3B",
              border: "2px solid #C23B3B",
            }}
          >
            {risked ? "⚔ Colpo critico attivato. Tocca per annullare" : "⚔ Tenta il colpo critico (doppi punti se giusto, -15 XP se sbagli)"}
          </button>
        )}

        {/* Opzioni */}
        <div className="flex flex-col gap-3">
          {current.options.map((opt, idx) => {
            const isSelected = selected === idx;
            const showCorrect = answered && idx === current.correct;
            const showWrong = answered && isSelected && idx !== current.correct;
            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={answered}
                className="text-left rounded-xl px-4 py-3 transition-all"
                style={{
                  background: showCorrect ? "#DCE8D0" : showWrong ? "#3A2020" : "#F5EAD0",
                  border: `2px solid ${
                    showCorrect ? "#241F3D" : showWrong ? "#C23B3B" : "#8B7355"
                  }`,
                  cursor: answered ? "default" : "pointer",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="mono text-xs px-1.5 py-0.5 rounded"
                    style={{ background: LEVEL_COLOR[opt.level], color: "#F5EAD0" }}
                  >
                    {opt.level}
                  </span>
                </div>
                <p className="text-sm" style={{ color: showWrong ? "#F5EAD0" : "#2B2318" }}>{opt.text}</p>
                {answered && (isSelected || showCorrect) && (
                  <p className="text-xs mt-2 italic" style={{ color: showWrong ? "#E8C9C9" : "#6E5B3F" }}>{opt.note}</p>
                )}
              </button>
            );
          })}
        </div>

        {answered && (
          <button
            onClick={handleNext}
            className="display w-full mt-6 py-3 rounded-xl text-base font-bold transition-transform active:scale-95"
            style={{ background: "#241F3D", color: "#F5EAD0" }}
          >
            {round + 1 >= gameRounds.length ? "Vedi risultato" : "Avanti"}
          </button>
        )}
      </div>
    </div>
  );
}
