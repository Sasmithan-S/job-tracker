import type { Statut } from "@/lib/types";

// Détection par mots-clés (français + anglais courants), sans appel IA :
// gratuit et suffisant pour la majorité des emails de réponse RH.
// Ordre important : on teste du plus "fort/spécifique" au plus générique.

const REFUS_PATTERNS = [
  /ne sommes (?:malheureusement |hélas )?pas en mesure/i,
  /n['’]avons (?:malheureusement |hélas )?pas (?:retenu|donné suite)/i,
  /n['’]a (?:malheureusement |hélas )?pas été retenue?/i,
  /ne (?:pourra|pourrons|donnerons) pas (?:donner suite|y donner suite)/i,
  /ne donnerons pas suite/i,
  /avons décidé de ne pas (?:poursuivre|donner suite)/i,
  /autre candidat(?:ure)?s? (?:a|ont) été retenue?s?/i,
  /profil ne correspond pas/i,
  /candidature n['’]a pas été sélectionnée/i,
  /nous ne (?:donnerons|pourrons) pas/i,
  /unfortunately.{0,40}(not|won't|will not|unable)/i,
  /we (?:regret|are sorry) to inform/i,
  /decided to move forward with other candidates/i,
  /not (?:been )?selected/i,
];

const ENTRETIEN_PATTERNS = [
  /(?:vous )?propos(?:er|ons) un entretien/i,
  /échanger avec vous/i,
  /vos disponibilités/i,
  /planifier (?:un|votre) entretien/i,
  /prochaine étape/i,
  /entretien (?:téléphonique|visio|physique)?/i,
  /convoqu(?:é|er) (?:pour|à) un entretien/i,
  /would like to (?:schedule|invite you)/i,
  /next step in (?:the|our) (?:hiring|recruitment) process/i,
  /schedule (?:a|an) (?:call|interview)/i,
];

const ACCEPTE_PATTERNS = [
  /avons le plaisir de vous (?:proposer|annoncer|confirmer)/i,
  /félicitations/i,
  /proposition d['’]embauche/i,
  /promesse d['’]embauche/i,
  /ravis de vous (?:accueillir|compter)/i,
  /votre candidature (?:a été|est) retenue/i,
  /nous vous (?:proposons|offrons) le poste/i,
  /congratulations/i,
  /pleased to offer you/i,
  /welcome to (?:the )?team/i,
];

export function classifyEmailStatus(text: string): Statut | null {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (REFUS_PATTERNS.some((p) => p.test(normalized))) return "refuse";
  if (ACCEPTE_PATTERNS.some((p) => p.test(normalized))) return "accepte";
  if (ENTRETIEN_PATTERNS.some((p) => p.test(normalized))) return "entretien";

  return null;
}

// Normalise un texte pour la recherche de correspondance (sans accents, minuscule)
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
