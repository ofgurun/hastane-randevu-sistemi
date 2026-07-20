import {
  HeartPulse, Eye, Ear, Baby, Brain, Bone, Stethoscope, Activity, Leaf,
  Smile, Droplet, Users, Flower2, Hand, Sparkles, Pill,
} from "lucide-react";

// Bölüm adına göre ikon + gradyan eşlemesi (görseldeki kartlar için).
// Anahtar kelime eşleşmesi Türkçe küçük harfle yapılır; eşleşme yoksa
// index'e göre dönen bir yedek paletle görsel tutarlılık korunur.
const RULES = [
  { keys: ["kardiyo", "kalp"], Icon: HeartPulse, gradient: "from-rose-500 to-red-700" },
  { keys: ["göz", "goz", "oftalmo"], Icon: Eye, gradient: "from-amber-400 to-orange-600" },
  { keys: ["kulak", "burun", "boğaz", "bogaz", "kbb"], Icon: Ear, gradient: "from-sky-500 to-blue-700" },
  { keys: ["çocuk", "cocuk", "pediatri"], Icon: Baby, gradient: "from-fuchsia-500 to-purple-700" },
  { keys: ["nöro", "noro", "beyin", "sinir"], Icon: Brain, gradient: "from-indigo-500 to-violet-700" },
  { keys: ["ortopedi", "kemik", "eklem"], Icon: Bone, gradient: "from-slate-500 to-slate-700" },
  { keys: ["dahiliye", "iç hast", "ic hast"], Icon: Stethoscope, gradient: "from-cyan-500 to-teal-700" },
  { keys: ["fizik", "fizyoterapi", "rehabil"], Icon: Activity, gradient: "from-green-500 to-emerald-700" },
  { keys: ["diyet", "beslenme"], Icon: Leaf, gradient: "from-lime-500 to-green-700" },
  { keys: ["diş", "dis", "ağız", "agiz", "ortodonti"], Icon: Smile, gradient: "from-teal-500 to-cyan-700" },
  { keys: ["üro", "uro", "böbrek", "bobrek"], Icon: Droplet, gradient: "from-blue-500 to-indigo-700" },
  { keys: ["aile", "genel"], Icon: Users, gradient: "from-stone-600 to-neutral-800" },
  { keys: ["kadın", "kadin", "doğum", "dogum", "jineko"], Icon: Flower2, gradient: "from-pink-500 to-rose-700" },
  { keys: ["derma", "cilt"], Icon: Hand, gradient: "from-orange-400 to-pink-600" },
  { keys: ["psikiyatri", "psikoloji", "ruh"], Icon: Sparkles, gradient: "from-violet-500 to-fuchsia-700" },
];

// Yedek palet (bilinmeyen bölümler için index'e göre)
const FALLBACK = [
  { gradient: "from-teal-500 to-cyan-700" },
  { gradient: "from-blue-500 to-indigo-700" },
  { gradient: "from-rose-500 to-red-700" },
  { gradient: "from-violet-500 to-purple-700" },
  { gradient: "from-amber-400 to-orange-600" },
  { gradient: "from-emerald-500 to-green-700" },
  { gradient: "from-pink-500 to-rose-700" },
  { gradient: "from-sky-500 to-blue-700" },
];

export function deptVisual(name = "", index = 0) {
  const lower = name.toLocaleLowerCase("tr");
  for (const rule of RULES) {
    if (rule.keys.some((k) => lower.includes(k))) {
      return { Icon: rule.Icon, gradient: rule.gradient };
    }
  }
  return { Icon: Pill, gradient: FALLBACK[index % FALLBACK.length].gradient };
}
