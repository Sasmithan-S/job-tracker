import * as cheerio from "cheerio";
import type { TypeEmploi } from "@/lib/types";

export interface ParsedJobInfo {
  poste?: string;
  entreprise?: string;
  type_emploi?: TypeEmploi;
  numero_reference?: string;
  // Indique au front quels champs ont vraiment été trouvés (vs laissés vides)
  source?: string;
}

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i, /^127\./, /^10\./, /^192\.168\./, /^169\.254\./,
  /^0\.0\.0\.0$/, /^172\.(1[6-9]|2\d|3[0-1])\./, /^\[?::1\]?$/, /\.local$/i,
];

export function isUrlSafeToFetch(rawUrl: string): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (!["http:", "https:"].includes(url.protocol)) return false;
  if (PRIVATE_HOST_PATTERNS.some((p) => p.test(url.hostname))) return false;
  return true;
}

// Mots/segments à retirer des titres récupérés depuis <title> ou og:title
const TITLE_NOISE = [
  /\(\s*[hf]\s*\/\s*[hf]\s*\/\s*x\s*\)/gi,    // (H/F/X) — le plus spécifique d'abord
  /\b[hf]\s*\/\s*[hf]\s*\/\s*x\b/gi,          // H/F/X sans parenthèses
  /\(\s*[hf]\s*\/\s*[hf]\s*\)/gi,             // (H/F), (F/H)
  /\b[hf]\s*\/\s*[hf]\b/gi,                   // H/F sans parenthèses
  /\(\s*m\s*\/\s*f\s*\)/gi,                   // (M/F)
  /\bm\s*\/\s*f\b/gi,                         // M/F
  /#\w+/g,                                     // hashtags
  /\s*[-–—|·•]\s*(welcome to the jungle|wttj|indeed|linkedin|apec|hellowork|monster|glassdoor|france travail|p[ôo]le emploi)\b.*$/i,
];

// Suffixes de nom de société à normaliser (on garde mais on nettoie l'espacement)
function cleanTitle(raw: string): string {
  let t = raw.replace(/\s+/g, " ").trim();
  for (const pattern of TITLE_NOISE) t = t.replace(pattern, " ");
  // Coupe sur séparateurs résiduels en gardant le segment le plus à gauche
  // SEULEMENT s'il reste assez de texte (évite de couper un titre légitime)
  const parts = t.split(/\s+[|·•–—]\s+/).map((s) => s.trim()).filter(Boolean);
  if (parts.length > 1 && parts[0].length >= 6) t = parts[0];
  return t.replace(/\s+/g, " ").trim();
}

function looksLikeNoise(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (v.length < 2) return true;
  // Rejette les titres génériques de page d'accueil/erreur
  const generic = [
    "offre d'emploi", "job offer", "recrutement", "carrière", "carrières",
    "careers", "home", "accueil", "connexion", "login", "page not found",
    "404", "error", "emploi", "jobs", "recruitment",
  ];
  return generic.includes(v);
}

function validEntreprise(value: string): boolean {
  const v = value.trim();
  if (v.length < 2 || v.length > 120) return false;
  if (looksLikeNoise(v)) return false;
  // Une URL n'est pas un nom d'entreprise
  if (/^https?:\/\//i.test(v)) return false;
  return true;
}

function validPoste(value: string): boolean {
  const v = value.trim();
  if (v.length < 2 || v.length > 150) return false;
  if (looksLikeNoise(v)) return false;
  return true;
}

export async function fetchAndParseJobPosting(rawUrl: string): Promise<ParsedJobInfo> {
  if (!isUrlSafeToFetch(rawUrl)) throw new Error("Lien invalide");

  const host = new URL(rawUrl).hostname.replace(/^www\./, "").toLowerCase();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  let html: string;
  try {
    const res = await fetch(rawUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) throw new Error(`La page a répondu avec une erreur (${res.status})`);
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) throw new Error("Ce lien ne pointe pas vers une page web lisible");
    html = (await res.text()).slice(0, 3_000_000);
  } catch (e: any) {
    if (e.name === "AbortError") throw new Error("Le site n'a pas répondu à temps");
    throw e;
  } finally {
    clearTimeout(timeout);
  }

  const $ = cheerio.load(html);
  const result: ParsedJobInfo = {};
  const found: string[] = [];

  // ---- 1. JSON-LD JobPosting : source prioritaire et la plus fiable ----
  const jsonLdInfo = extractFromJsonLd($);
  if (jsonLdInfo.poste && validPoste(jsonLdInfo.poste)) { result.poste = jsonLdInfo.poste; found.push("titre"); }
  if (jsonLdInfo.entreprise && validEntreprise(jsonLdInfo.entreprise)) { result.entreprise = jsonLdInfo.entreprise; found.push("entreprise"); }
  if (jsonLdInfo.numero_reference) { result.numero_reference = jsonLdInfo.numero_reference; found.push("référence"); }
  if (jsonLdInfo.type_emploi) { result.type_emploi = jsonLdInfo.type_emploi; }

  // ---- 2. Sélecteurs spécifiques par site (quand pas de JSON-LD complet) ----
  const siteInfo = extractBySite($, host);
  if (!result.poste && siteInfo.poste && validPoste(siteInfo.poste)) { result.poste = cleanTitle(siteInfo.poste); found.push("titre"); }
  if (!result.entreprise && siteInfo.entreprise && validEntreprise(siteInfo.entreprise)) { result.entreprise = siteInfo.entreprise; found.push("entreprise"); }

  // ---- 3. Open Graph ----
  if (!result.poste) {
    const ogTitle = $('meta[property="og:title"]').attr("content");
    if (ogTitle) {
      const cleaned = cleanTitle(ogTitle);
      if (validPoste(cleaned)) { result.poste = cleaned; found.push("titre"); }
    }
  }
  if (!result.entreprise) {
    const ogSite = $('meta[property="og:site_name"]').attr("content");
    if (ogSite && validEntreprise(ogSite) && !isKnownJobboard(ogSite)) {
      result.entreprise = ogSite.trim();
      found.push("entreprise");
    }
  }

  // ---- 4. Repli <title> (le moins fiable, on nettoie agressivement) ----
  if (!result.poste) {
    const titleTag = $("title").first().text();
    if (titleTag) {
      const cleaned = cleanTitle(titleTag);
      if (validPoste(cleaned)) { result.poste = cleaned; found.push("titre"); }
    }
  }

  // ---- 5. Type de contrat : depuis JSON-LD sinon mots-clés ciblés ----
  if (!result.type_emploi) {
    // On cherche d'abord dans le titre extrait (plus précis que tout le body)
    const fromTitle = result.poste ? guessTypeFromText(result.poste.toLowerCase()) : undefined;
    if (fromTitle) result.type_emploi = fromTitle;
    else {
      const bodyText = $("body").text().slice(0, 8000).toLowerCase();
      result.type_emploi = guessTypeFromText(bodyText);
    }
  }
  if (result.type_emploi) found.push("type");

  // Nettoyage final + bornes
  if (result.poste) result.poste = truncate(result.poste, 150);
  if (result.entreprise) result.entreprise = truncate(result.entreprise, 120);
  if (result.numero_reference) result.numero_reference = truncate(result.numero_reference, 60);

  result.source = found.length ? Array.from(new Set(found)).join(", ") : undefined;
  return result;
}

function extractFromJsonLd($: cheerio.CheerioAPI): ParsedJobInfo {
  const out: ParsedJobInfo = {};
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    if (!raw) return;
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Certains sites concatènent mal le JSON-LD ; on tente une réparation simple
      try {
        parsed = JSON.parse(raw.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]"));
      } catch {
        return;
      }
    }
    const nodes = Array.isArray(parsed) ? parsed : parsed["@graph"] ?? [parsed];
    for (const node of nodes) {
      if (!node || typeof node !== "object") continue;
      const type = node["@type"];
      const isJobPosting = type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"));
      if (!isJobPosting) continue;

      if (node.title && !out.poste) out.poste = decodeEntities(String(node.title).trim());

      const orgName = node.hiringOrganization?.name ?? node.hiringOrganization?.legalName;
      if (orgName && !out.entreprise) out.entreprise = decodeEntities(String(orgName).trim());

      const ident = node.identifier;
      const identValue = typeof ident === "string" ? ident : ident?.value;
      if (identValue && !out.numero_reference) out.numero_reference = String(identValue).trim();

      const employmentType = node.employmentType;
      const empStr = Array.isArray(employmentType) ? employmentType.join(" ") : employmentType;
      const guessed = empStr ? guessTypeFromSchemaValue(String(empStr)) : undefined;
      if (guessed && !out.type_emploi) out.type_emploi = guessed;
    }
  });
  return out;
}

// Sélecteurs par site pour les cas où le JSON-LD est absent/partiel
function extractBySite($: cheerio.CheerioAPI, host: string): ParsedJobInfo {
  const out: ParsedJobInfo = {};

  if (host.includes("welcometothejungle")) {
    out.poste = $('h1, [data-testid="job-title"]').first().text().trim() || undefined;
    out.entreprise =
      $('[data-testid="job-header-organization-title"], a[href*="/companies/"]').first().text().trim() || undefined;
  } else if (host.includes("indeed")) {
    out.poste = $('h1.jobsearch-JobInfoHeader-title, h1[data-testid="jobsearch-JobInfoHeader-title"]').first().text().trim() || undefined;
    out.entreprise = $('[data-testid="inlineHeader-companyName"], [data-company-name]').first().text().trim() || undefined;
  } else if (host.includes("apec")) {
    out.poste = $("h1").first().text().trim() || undefined;
    out.entreprise = $(".details-post-key-figures-company, .card-offer__company").first().text().trim() || undefined;
  } else if (host.includes("hellowork") || host.includes("regionsjob")) {
    out.poste = $("h1").first().text().trim() || undefined;
    out.entreprise = $('[data-cy="companyName"], .tw-typo-l').first().text().trim() || undefined;
  } else if (host.includes("francetravail") || host.includes("pole-emploi")) {
    out.poste = $("h1").first().text().trim() || undefined;
    out.entreprise = $(".media-heading, .entreprise-name").first().text().trim() || undefined;
  } else if (host.includes("linkedin")) {
    // LinkedIn renvoie souvent une page de login côté serveur : best-effort
    out.poste = $("h1").first().text().trim() || undefined;
    out.entreprise = $('a[href*="/company/"]').first().text().trim() || undefined;
  } else {
    // Générique : le premier h1 raisonnable
    const h1 = $("h1").first().text().trim();
    if (h1 && h1.length <= 150) out.poste = h1;
  }

  if (out.poste) out.poste = out.poste.replace(/\s+/g, " ");
  if (out.entreprise) out.entreprise = out.entreprise.replace(/\s+/g, " ");
  return out;
}

const KNOWN_JOBBOARDS = [
  "indeed", "linkedin", "welcome to the jungle", "wttj", "apec", "hellowork",
  "monster", "glassdoor", "france travail", "pôle emploi", "pole emploi",
  "regionsjob", "cadremploi", "meteojob",
];
function isKnownJobboard(name: string): boolean {
  const n = name.toLowerCase();
  return KNOWN_JOBBOARDS.some((j) => n.includes(j));
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&eacute;/g, "é").replace(/&egrave;/g, "è").replace(/&agrave;/g, "à");
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max).trim() : s;
}

function guessTypeFromSchemaValue(raw: string): TypeEmploi | undefined {
  const s = raw.toUpperCase();
  if (s.includes("INTERN")) return "Stage";
  if (s.includes("APPRENTICE")) return "Alternance";
  if (s.includes("TEMPORARY")) return "Intérim";
  if (s.includes("CONTRACTOR")) return "Freelance";
  if (s.includes("PER_DIEM") || s.includes("OTHER")) return undefined;
  if (s.includes("FULL_TIME") || s.includes("PART_TIME")) return "CDI";
  return undefined;
}

function guessTypeFromText(text: string): TypeEmploi | undefined {
  // Ordre : du plus spécifique au plus générique
  if (/\balternance\b|\bapprentissage\b|contrat\s+d['e]\s*alternance/.test(text)) return "Alternance";
  if (/\bstage\b|\bstagiaire\b|\binternship\b/.test(text)) return "Stage";
  if (/\bint[ée]rim\b|\bmission\s+d['e]?\s*int[ée]rim/.test(text)) return "Intérim";
  if (/\bfreelance\b|ind[ée]pendant|\bportage\b/.test(text)) return "Freelance";
  if (/\bcdd\b|dur[ée]e\s+d[ée]termin[ée]e/.test(text)) return "CDD";
  if (/\bcdi\b|dur[ée]e\s+ind[ée]termin[ée]e/.test(text)) return "CDI";
  return undefined;
}
