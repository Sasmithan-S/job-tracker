# Candidatures Tracker

Suivi de candidatures : colle le lien d'une offre, suis le statut (en attente,
entretien, refusé, accepté...), trie par type de poste. Connecte Gmail pour
que le statut se mette à jour tout seul quand une réponse arrive.

Stack : Next.js 14 (App Router) + Supabase (auth + base de données) + Gmail
API. 100% déployable gratuitement (Vercel Hobby + Supabase Free).

---

## 1. Créer le projet Supabase (gratuit)

1. Va sur [supabase.com](https://supabase.com) → New project.
2. Une fois créé, ouvre **SQL Editor** → New query, colle le contenu de
   `supabase/schema.sql` et clique **Run**. Ça crée les 3 tables et les
   règles de sécurité (RLS : chacun ne voit que ses propres données).
3. Dans **Project Settings > API**, récupère :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ secrète, ne jamais
     l'exposer côté client)
4. Dans **Authentication > Settings**, tu peux désactiver "Confirm email" en
   développement pour aller plus vite (à réactiver en prod).

## 2. Configurer Gmail (pour la mise à jour automatique des statuts)

C'est l'étape la plus longue, mais elle est gratuite.

1. Va sur [console.cloud.google.com](https://console.cloud.google.com) →
   crée un nouveau projet.
2. **APIs & Services > Library** → cherche "Gmail API" → Enable.
3. **APIs & Services > OAuth consent screen** :
   - Type : External
   - Renseigne nom de l'app, email support, email contact dev
   - Scopes : ajoute `.../auth/gmail.readonly` et
     `.../auth/userinfo.email`
   - **Test users** : ajoute l'email de chaque personne qui utilisera l'app
     (toi + tes proches). C'est la limite du mode gratuit non-vérifié :
     jusqu'à 100 utilisateurs de test, sans passer par la vérification
     Google (qui prend du temps et n'est utile que si tu veux ouvrir l'app
     au grand public).
4. **APIs & Services > Credentials** → Create Credentials → OAuth client ID :
   - Type : Web application
   - Authorized redirect URIs : ajoute
     `http://localhost:3000/api/gmail/callback` (dev) et
     `https://ton-projet.vercel.app/api/gmail/callback` (prod, à ajouter une
     fois le nom de domaine Vercel connu)
   - Récupère `Client ID` → `GOOGLE_CLIENT_ID` et `Client secret` →
     `GOOGLE_CLIENT_SECRET`

⚠️ Tant que l'app reste en mode "Testing" (non vérifiée par Google), les
utilisateurs verront un écran "Google n'a pas vérifié cette application" en
se connectant — c'est normal, il faut cliquer "Avancé > Continuer". Pour
lever cet écran il faudrait soumettre l'app à la vérification Google
(process payant en temps, pas en argent, pertinent seulement si tu veux
ouvrir ça au public).

## 3. Variables d'environnement

Copie `.env.example` vers `.env.local` et remplis les valeurs récupérées aux
étapes 1 et 2. Génère `CRON_SECRET` avec :

```bash
openssl rand -hex 32
```

## 4. Lancer en local

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## 5. Déployer sur Vercel (gratuit)

1. Pousse le projet sur GitHub.
2. Sur [vercel.com](https://vercel.com) → New Project → importe le repo.
3. Ajoute toutes les variables de `.env.example` dans **Settings >
   Environment Variables** (avec les vraies valeurs). Mets
   `NEXT_PUBLIC_APP_URL` sur l'URL Vercel finale (ex:
   `https://candidatures-toi.vercel.app`).
4. Deploy.
5. Reviens dans Google Cloud Console → Credentials → ajoute l'URL de
   callback prod (`https://ton-domaine.vercel.app/api/gmail/callback`) aux
   Authorized redirect URIs.
6. Le cron quotidien (`vercel.json`) est déployé automatiquement et
   synchronise tous les utilisateurs connectés une fois par jour à 6h UTC —
   c'est la limite du plan gratuit Vercel (1 exécution/jour max sur Hobby).
   Le bouton **"Synchroniser maintenant"** dans l'app n'a lui aucune limite,
   utilisable à tout moment.

## Comment fonctionne la détection automatique de statut

Quand une synchro se déclenche (cron quotidien ou bouton manuel) :

1. On récupère les emails reçus depuis la dernière synchro.
2. Pour chaque email, on cherche une correspondance avec une candidature :
   en priorité via le **numéro de référence** (le plus fiable, si renseigné),
   sinon via le **nom de l'entreprise**.
3. Si une correspondance est trouvée, on analyse le texte de l'email avec
   des mots-clés (refus, entretien, embauche, en français et anglais) pour
   déterminer le nouveau statut.
4. Le statut est mis à jour et l'événement est tracé dans l'historique
   (visible depuis le menu "..." de chaque candidature), avec l'extrait
   d'email qui a déclenché le changement — pour garder confiance dans
   l'automatisation.

Cette détection est gratuite (pas d'appel à une IA payante), basée sur des
expressions régulières dans `lib/emailClassifier.ts`. Si tu veux l'affiner,
c'est le seul fichier à modifier.

## Limites connues (plan gratuit)

- **Vercel Hobby** : cron 1x/jour max → compensé par le bouton de sync
  manuelle, illimité.
- **Gmail OAuth non vérifié** : jusqu'à 100 utilisateurs de test, écran
  d'avertissement Google au premier login Gmail (normal, pas un bug).
- **Supabase Free** : 500 Mo de base de données, largement suffisant pour
  ce cas d'usage (des dizaines de milliers de candidatures).
- Le `refresh_token` Gmail est stocké en clair dans Supabase, protégé par
  les règles RLS (chacun ne peut lire que le sien) et par la clé
  `service_role` qui ne quitte jamais le serveur. Pour un usage à plus
  grande échelle, chiffre-le avant stockage (ex: `pgsodium` côté Supabase).

## Structure du projet

```
app/
  login/              page de connexion/inscription
  dashboard/           page principale (liste, filtres, stats)
  auth/callback/       callback Supabase (confirmation email)
  api/
    applications/      CRUD candidatures
    gmail/              connect / callback / sync / disconnect
    cron/sync-emails/  route appelée par Vercel Cron
components/             composants UI (cards, modals, filtres...)
lib/
  supabase/             clients Supabase (browser / server / admin)
  gmail.ts               appels REST Gmail + OAuth
  emailClassifier.ts     détection de statut par mots-clés
  syncMailbox.ts          logique de synchro partagée (manuel + cron)
  types.ts                types partagés + constantes (statuts, types d'emploi)
supabase/schema.sql     schéma SQL à exécuter dans Supabase
```
