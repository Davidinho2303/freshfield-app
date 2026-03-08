# Freshfield

## Lokale Entwicklung

### 1. Abhängigkeiten installieren
```bash
npm install
```

### 2. Umgebungsvariablen einrichten
```bash
cp .env.local.example .env.local
```
Die Datei `.env.local` ist bereits mit deinen Supabase-Keys befüllt.

### 3. Datenbank einrichten
1. Geh zu: https://supabase.com/dashboard/project/fdmiegoofvrvrxtpdzey/sql/new
2. Kopiere den Inhalt von `supabase/migrations/001_initial.sql`
3. Füge ihn im SQL-Editor ein und klicke **Run**

### 4. Auth-URL konfigurieren
1. Geh zu: https://supabase.com/dashboard/project/fdmiegoofvrvrxtpdzey/auth/url-configuration
2. Setze **Site URL** auf: `http://localhost:3000`
3. Füge unter **Redirect URLs** hinzu: `http://localhost:3000/auth/callback`

### 5. App starten
```bash
npm run dev
```
→ Öffne http://localhost:3000

---

## Deployment auf Vercel

### 1. GitHub Repo erstellen
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/DEIN-USERNAME/freshfield.git
git push -u origin main
```

### 2. Vercel verknüpfen
1. Geh zu: https://vercel.com/new
2. "Import Git Repository" → dein freshfield Repo auswählen
3. Framework: **Next.js** (wird automatisch erkannt)
4. Environment Variables hinzufügen:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://fdmiegoofvrvrxtpdzey.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (aus .env.local)
5. **Deploy**

### 3. Auth-URL für Produktion aktualisieren
Nach dem ersten Deploy:
1. Geh zu Supabase → Auth → URL Configuration
2. **Site URL** auf deine Vercel-URL setzen (z.B. `https://freshfield.vercel.app`)
3. **Redirect URLs** ergänzen: `https://freshfield.vercel.app/auth/callback`

---

## Seiten-Übersicht

| Route | Beschreibung |
|-------|-------------|
| `/` | Landing Page |
| `/auth/login` | Login / Account erstellen (Magic Link) |
| `/feed` | Entdeckungsfeed (nur eingeloggt) |
| `/profil/[slug]` | Künstlerprofil |
| `/werk/[id]` | Werk-Detailseite mit Kommentaren |
| `/upload` | Werk hochladen (nur Aussteller) |
