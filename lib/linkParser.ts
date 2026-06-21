import * as cheerio from "cheerio";
import type { TypeEmploi } from "@/lib/types";

export interface ParsedJobInfo {
  poste?: string;
  entreprise?: string;
  type_emploi?: TypeEmploi;
  numero_reference?: string;
}

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\.0\.0\.0$/,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^\[?::1\]?$/,
  /\.local$/i,
];

// Empêche le serveur d'aller fetch des adresses internes (protection SSRF basique)
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

export async function fetchAndParseJobPosting(rawUrl: string): Promise<ParsedJobInfo> {
  if (!isUrlSafeToFetch(rawUrl)) {
    throw new Error("Lien invalide");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  let html: string;
  try {
    const res = await fetch(rawUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) throw new Error(`La page a répondu avec une erreur (${res.status})`);
    html = (await res.text()).slice(0, 2_000_000);
  } catch (e: any) {
    if (e.name === "AbortError") throw new Error("Le site n'a pas répondu à temps");
    throw e;
  } finally {
    clearTimeout(timeout);
  }

  const $ = cheerio.load(html);
  const result: ParsedJobInfo = {};

  // 1. JSON-LD JobPosting (schema.org) — la source la plus fiable, utilisée
  // par la plupart des jobboards sérieux pour le référencement Google for Jobs.
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    if (!raw) return;
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    const nodes = Array.isArray(parsed) ? parsed : parsed["@graph"] ?? [parsed];

    for (const node of nodes) {
      if (!node) continue;
      const type = node["@type"];
      const isJobPosting = type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"));
      if (!isJobPosting) continue;

      if (node.title && !result.poste) result.poste = String(node.title).trim();

      const orgName = node.hiringOrganization?.name;
      if (orgName && !result.entreprise) result.entreprise = String(orgName).trim();

      const ident = node.identifier;
      const identValue = typeof ident === "string" ? ident : ident?.value;
      if (identValue && !result.numero_reference) result.numero_reference = String(identValue).trim();

      const employmentType = node.employmentType;
      const empStr = Array.isArray(employmentType) ? employmentType.join(" ") : employmentType;
      const guessed = empStr ? guessTypeFromSchemaValue(empStr) : undefined;
      if (guessed) result.type_emploi = guessed;
    }
  });

  // 2. Repli Open Graph / balise <title>
  if (!result.poste) {
    const ogTitle = $('meta[property="og:title"]').attr("content");
    if (ogTitle) result.poste = ogTitle.trim();
  }
  if (!result.poste) {
    const titleTag = $("title").first().text();
    if (titleTag) result.poste = titleTag.split(/[-|–]/)[0].trim();
  }
  if (!result.entreprise) {
    const ogSite = $('meta[property="og:site_name"]').attr("content");
    if (ogSite) result.entreprise = ogSite.trim();
  }

  // 3. Repli : type de contrat détecté dans le texte visible (mots-clés FR)
  if (!result.type_emploi) {
    const bodyText = $("body").text().slice(0, 6000).toLowerCase();
    result.type_emploi = guessTypeFromText(bodyText);
  }

  if (result.poste) result.poste = truncate(result.poste, 150);
  if (result.entreprise) result.entreprise = truncate(result.entreprise, 150);
  if (result.numero_reference) result.numero_reference = truncate(result.numero_reference, 60);

  return result;
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max).trim() : s;
}

function guessTypeFromSchemaValue(raw: string): TypeEmploi | undefined {
  const s = raw.toUpperCase();
  if (s.includes("INTERN")) return "Stage";
  if (s.includes("TEMPORARY")) return "Intérim";
  if (s.includes("CONTRACTOR")) return "Freelance";
  if (s.includes("FULL_TIME") || s.includes("PART_TIME")) return "CDI";
  return undefined;
}

function guessTypeFromText(text: string): TypeEmploi | undefined {
  if (/\balternance\b/.test(text)) return "Alternance";
  if (/\bstage\b/.test(text)) return "Stage";
  if (/\bcdd\b/.test(text)) return "CDD";
  if (/\bcdi\b/.test(text)) return "CDI";
  if (/freelance|ind[ée]pendant/.test(text)) return "Freelance";
  if (/int[ée]rim/.test(text)) return "Intérim";
  return undefined;
}
