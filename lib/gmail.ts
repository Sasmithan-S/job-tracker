// Intégration Gmail en appels REST directs (pas de SDK googleapis,
// pour garder le bundle léger). Scope utilisé : gmail.readonly (lecture seule).

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API_BASE = "https://www.googleapis.com/gmail/v1/users/me";

export function getRedirectUri() {
  const base = process.env.NEXT_PUBLIC_APP_URL!;
  return `${base.replace(/\/$/, "")}/api/gmail/callback`;
}

export function buildGoogleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Échange de code Google échoué: ${await res.text()}`);
  return res.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    id_token?: string;
  }>;
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Rafraîchissement du token Google échoué: ${await res.text()}`);
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

export async function getGoogleUserEmail(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Impossible de récupérer l'email Google");
  const data = await res.json();
  return data.email as string;
}

interface GmailListResponse {
  messages?: { id: string; threadId: string }[];
  nextPageToken?: string;
}

export async function listRecentMessageIds(accessToken: string, afterUnixSeconds: number) {
  const ids: string[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `after:${afterUnixSeconds} -in:chats -in:spam`,
      maxResults: "50",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`${GMAIL_API_BASE}/messages?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Liste des emails échouée: ${await res.text()}`);
    const data: GmailListResponse = await res.json();
    if (data.messages) ids.push(...data.messages.map((m) => m.id));
    pageToken = data.nextPageToken;
    // Limite de sécurité pour ne pas exploser le quota en un seul sync
  } while (pageToken && ids.length < 150);

  return ids;
}

interface GmailMessagePart {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailMessagePart[];
}

interface GmailMessage {
  id: string;
  snippet?: string;
  payload?: {
    headers?: { name: string; value: string }[];
    mimeType?: string;
    body?: { data?: string };
    parts?: GmailMessagePart[];
  };
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return Buffer.from(base64, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function extractTextFromParts(part: GmailMessagePart | undefined): string {
  if (!part) return "";
  if (part.body?.data && (part.mimeType === "text/plain" || part.mimeType === "text/html")) {
    const decoded = decodeBase64Url(part.body.data);
    return part.mimeType === "text/html" ? decoded.replace(/<[^>]+>/g, " ") : decoded;
  }
  if (part.parts) {
    // Préfère text/plain s'il existe
    const plain = part.parts.find((p) => p.mimeType === "text/plain");
    if (plain) return extractTextFromParts(plain);
    const html = part.parts.find((p) => p.mimeType === "text/html");
    if (html) return extractTextFromParts(html);
    return part.parts.map(extractTextFromParts).join(" ");
  }
  return "";
}

export interface ParsedEmail {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  bodyText: string;
}

export async function getMessage(accessToken: string, id: string): Promise<ParsedEmail | null> {
  const res = await fetch(`${GMAIL_API_BASE}/messages/${id}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data: GmailMessage = await res.json();

  const headers = data.payload?.headers ?? [];
  const subject = headers.find((h) => h.name.toLowerCase() === "subject")?.value ?? "";
  const from = headers.find((h) => h.name.toLowerCase() === "from")?.value ?? "";
  const bodyText = extractTextFromParts(data.payload as GmailMessagePart).slice(0, 5000);

  return { id: data.id, subject, from, snippet: data.snippet ?? "", bodyText };
}
