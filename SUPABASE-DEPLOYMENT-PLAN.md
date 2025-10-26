# ☁️ SUPABASE + NETLIFY DEPLOYMENT PLAN
## Projekt Követő Rendszer - Cloud-Native Serverless Architecture

---

## 🎯 ÁTTEKINTÉS

**Ez egy TELJESEN ÚJ ARCHITEKTÚRA!**

Ez a terv leírja, hogyan kell átalakítani és deployolni a Projekt Követő Rendszert **Supabase** (backend) és **Netlify** (frontend) platformokra.

### Mi változik?

| Komponens | JELENLEGI (ISPConfig) | ÚJ (Supabase + Netlify) |
|-----------|------------------------|--------------------------|
| **Backend** | Node.js + Express (saját szerver) | Supabase Backend-as-a-Service |
| **Adatbázis** | MySQL 8.0 | PostgreSQL 15+ (Supabase) |
| **API** | Saját REST API (Express routes) | Supabase Auto-generated REST API |
| **Real-time** | Socket.IO (WebSocket) | Supabase Realtime (PostgreSQL subscriptions) |
| **Authentication** | JWT (saját implementáció) | Supabase Auth (beépített) |
| **Frontend hosting** | Apache/Nginx (saját szerver) | Netlify CDN (globális) |
| **File storage** | Szerver filesystem | Supabase Storage (S3-like) |
| **Functions** | Express.js routes | Supabase Edge Functions (Deno) |
| **Monitoring** | PM2, manual logs | Supabase Dashboard, Netlify Analytics |
| **Cost** | $5-20/hó (VPS) | **INGYENES** (kezdőknek) |
| **Skálázhatóság** | Manuális (server upgrade) | Automatikus (serverless) |
| **Biztonság** | Kézi beállítások | Beépített (row-level security) |
| **CI/CD** | Manuális deployment | Git push → auto deploy |

---

## ⏱️ BECSÜLT IDŐIGÉNY

| Fázis | Időigény | Nehézség |
|-------|----------|----------|
| Supabase projekt létrehozása | 10 perc | Könnyű |
| Adatbázis séma migrálás (MySQL → PostgreSQL) | 30 perc | Közepes |
| Supabase Auth beállítása | 15 perc | Könnyű |
| Frontend átalakítása (Supabase client) | 60 perc | Közepes |
| Real-time subscriptions implementálása | 45 perc | Közepes |
| Netlify projekt létrehozása | 10 perc | Könnyű |
| Frontend build és deploy | 15 perc | Könnyű |
| Tesztelés és finomhangolás | 30 perc | Közepes |
| **ÖSSZESEN** | **~215 perc (~3.5 óra)** | **Közepes** |

**FONTOS:** Ez NEM tartalmazza az eredeti kód átírását! Csak a migrációs terv!

---

## 💰 KÖLTSÉGEK

### Supabase Pricing

| Tier | Ár | Jellemzők |
|------|-----|-----------|
| **Free** | $0/hó | 500 MB database, 1 GB file storage, 2 GB bandwidth, 50,000 monthly active users |
| **Pro** | $25/hó | 8 GB database, 100 GB storage, 250 GB bandwidth, 100,000 MAU |
| **Team** | $599/hó | Korlátlan (custom) |

**→ Kezdéshez INGYENES!** 🎉

### Netlify Pricing

| Tier | Ár | Jellemzők |
|------|-----|-----------|
| **Free** | $0/hó | 100 GB bandwidth, 300 build minutes, HTTPS, CDN |
| **Pro** | $19/hó | 400 GB bandwidth, unlimited builds |
| **Business** | $99/hó | 1 TB bandwidth, advanced features |

**→ Kezdéshez INGYENES!** 🎉

**Teljes költség kezdőknek: $0/hó** (később fizetős, ha nő a forgalom)

---

## 🏗️ ÚJ ARCHITEKTÚRA

```
┌─────────────────────────────────────────────────────────────┐
│                     USER (BROWSER)                          │
│              https://projekt-koveto.netlify.app             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                ┌───────▼────────┐
                │   NETLIFY CDN  │
                │  (Edge Network)│
                │   Static Files │
                └───────┬────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌─────▼────────┐ ┌───▼─────────┐
│   HTML/JS    │ │  Supabase JS │ │  Supabase   │
│   CSS/Assets │ │    Client    │ │  Realtime   │
│              │ │  (API calls) │ │ (WebSocket) │
└──────────────┘ └──────┬───────┘ └──────┬──────┘
                        │                │
                ┌───────▼────────────────▼─────┐
                │      SUPABASE CLOUD          │
                │  ┌──────────────────────┐    │
                │  │  PostgreSQL Database │    │
                │  │  - users table       │    │
                │  │  - projects table    │    │
                │  │  - tasks table       │    │
                │  │  - settings table    │    │
                │  └──────────────────────┘    │
                │                               │
                │  ┌──────────────────────┐    │
                │  │  Supabase Auth       │    │
                │  │  - Email/password    │    │
                │  │  - OAuth (Google)    │    │
                │  │  - JWT tokens        │    │
                │  └──────────────────────┘    │
                │                               │
                │  ┌──────────────────────┐    │
                │  │  Supabase Realtime   │    │
                │  │  - PostgreSQL        │    │
                │  │    subscriptions     │    │
                │  │  - Broadcast         │    │
                │  └──────────────────────┘    │
                │                               │
                │  ┌──────────────────────┐    │
                │  │  Auto-generated API  │    │
                │  │  - REST endpoints    │    │
                │  │  - Row-level security│    │
                │  └──────────────────────┘    │
                │                               │
                │  ┌──────────────────────┐    │
                │  │  Edge Functions      │    │
                │  │  (Deno serverless)   │    │
                │  │  - Custom logic      │    │
                │  │  - Email sending     │    │
                │  └──────────────────────┘    │
                └───────────────────────────────┘

KEY:
─────  HTTPS REST API calls
═════  Database connection (internal)
▲▲▲▲▲  WebSocket (Realtime subscriptions)
```

---

## 📋 TELEPÍTÉSI FOLYAMAT

### FÁZIS 1: SUPABASE PROJEKT LÉTREHOZÁSA (10 perc)

#### 1.1 Regisztráció és Bejelentkezés

1. Látogass el: **https://supabase.com**
2. Kattints: **Start your project**
3. Regisztráció:
   - GitHub account használata (ajánlott)
   - VAGY Email + jelszó
4. Email megerősítés (ha szükséges)

#### 1.2 Új Projekt Létrehozása

1. Dashboard: **New project**
2. Töltsd ki:
   - **Name:** `projekt-koveto` (vagy egyedi név)
   - **Database Password:** Generálj egy erős jelszót
     - **ÍRD FEL!** ___________________________________
   - **Region:** `Europe (Frankfurt)` (legközelebbi EU régió)
   - **Pricing Plan:** **Free**
3. Kattints: **Create new project**

**Várj 2-3 percet** → Projekt létrejön

#### 1.3 Projekt Adatok Mentése

**Dashboard → Settings → API**

Másold le ezeket (KRITIKUS!):

```
Project URL: https://[PROJECT_REF].supabase.co
  ÍRD FEL: _________________________________________

API Keys:
  anon (public) key: eyJhbGc...
    ÍRD FEL: _________________________________________

  service_role (secret) key: eyJhbGc...
    ÍRD FEL: _________________________________________
```

**⚠️ NE OSZD MEG A service_role KEY-T!** (Backend-only!)

**✅ CHECKPOINT:** Supabase projekt létrehozva, API kulcsok elmentve

---

### FÁZIS 2: ADATBÁZIS SÉMA MIGRÁLÁS (30 perc)

#### 2.1 MySQL Schema Átalakítása PostgreSQL-re

**Fő különbségek:**

| MySQL | PostgreSQL |
|-------|------------|
| `AUTO_INCREMENT` | `SERIAL` vagy `GENERATED ALWAYS AS IDENTITY` |
| `TINYINT(1)` (boolean) | `BOOLEAN` |
| `DATETIME` | `TIMESTAMP WITH TIME ZONE` |
| `VARCHAR(255)` | `VARCHAR(255)` vagy `TEXT` |
| `ENUM('a','b')` | `TEXT CHECK (value IN ('a','b'))` |

#### 2.2 PostgreSQL Séma Létrehozása

**Supabase Dashboard → SQL Editor → New query**

Másold be ezt a SQL-t:

```sql
-- ============================================
-- PROJEKT KÖVETŐ RENDSZER - PostgreSQL Schema
-- ============================================

-- 1. UUID Extension (opcionális, de ajánlott)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Projects Table
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('open', 'in_progress', 'completed')) DEFAULT 'open',
  color VARCHAR(20) DEFAULT '#667eea',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tasks Table
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  deadline DATE,
  owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('open', 'in_progress', 'completed')) DEFAULT 'open',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Settings Table
CREATE TABLE settings (
  key_name VARCHAR(255) PRIMARY KEY,
  value_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Indexes for Performance
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_owner_id ON tasks(owner_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);

-- 7. Updated_at Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Apply Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Enable Realtime (FONTOS!)
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- ✅ Schema létrehozva!
```

**Kattints: Run** (vagy `CTRL+ENTER`)

**Ellenőrzés:**
- Supabase Dashboard → **Table Editor**
- Látható: `users`, `projects`, `tasks`, `settings` táblák

**✅ CHECKPOINT:** PostgreSQL séma létrehozva, Realtime engedélyezve

#### 2.3 Row Level Security (RLS) Beállítása

**FONTOS!** Supabase-ben alapértelmezetten **minden tábla zárt**. Engedélyezni kell a hozzáférést!

**SQL Editor → New query:**

```sql
-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- 1. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 2. Users Table Policies
-- Authenticated users can read all users (for assignment dropdowns)
CREATE POLICY "Users can read all users"
  ON users FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = id::text);

-- 3. Projects Table Policies
-- Authenticated users can read all projects
CREATE POLICY "Users can read all projects"
  ON projects FOR SELECT
  USING (auth.role() = 'authenticated');

-- Authenticated users can create projects
CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Project owners can update their projects
CREATE POLICY "Owners can update projects"
  ON projects FOR UPDATE
  USING (owner_id::text = auth.uid()::text);

-- Project owners can delete their projects
CREATE POLICY "Owners can delete projects"
  ON projects FOR DELETE
  USING (owner_id::text = auth.uid()::text);

-- 4. Tasks Table Policies
-- Authenticated users can read all tasks
CREATE POLICY "Users can read all tasks"
  ON tasks FOR SELECT
  USING (auth.role() = 'authenticated');

-- Authenticated users can create tasks
CREATE POLICY "Users can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Task owners or project owners can update tasks
CREATE POLICY "Owners can update tasks"
  ON tasks FOR UPDATE
  USING (
    owner_id::text = auth.uid()::text OR
    project_id IN (SELECT id FROM projects WHERE owner_id::text = auth.uid()::text)
  );

-- Task owners or project owners can delete tasks
CREATE POLICY "Owners can delete tasks"
  ON tasks FOR DELETE
  USING (
    owner_id::text = auth.uid()::text OR
    project_id IN (SELECT id FROM projects WHERE owner_id::text = auth.uid()::text)
  );

-- 5. Settings Table Policies
-- Everyone can read settings
CREATE POLICY "Users can read settings"
  ON settings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can modify settings (implementáld később)
-- CREATE POLICY "Admins can modify settings"
--   ON settings FOR ALL
--   USING (auth.jwt() ->> 'role' = 'admin');

-- ✅ RLS Policies beállítva!
```

**Kattints: Run**

**✅ CHECKPOINT:** Row Level Security beállítva

#### 2.4 Demo Adatok Importálása (Opcionális)

```sql
-- Demo Users (Supabase Auth-ba kell majd regisztrálni külön!)
-- Ezek csak placeholder-ek a táblában
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin User', 'admin@example.com', 'placeholder', 'admin'),
  ('Kovács János', 'janos@example.com', 'placeholder', 'user'),
  ('Nagy Anna', 'anna@example.com', 'placeholder', 'user');

-- Demo Projects
INSERT INTO projects (name, description, start_date, end_date, owner_id, status, color) VALUES
  ('E-commerce platform', 'Online webshop fejlesztés', '2025-01-15', '2025-04-30', 2, 'in_progress', '#667eea'),
  ('Mobile UI design', 'iOS és Android UI/UX tervezés', '2025-02-01', '2025-03-15', 3, 'in_progress', '#764ba2');

-- Demo Tasks
INSERT INTO tasks (project_id, name, description, start_date, deadline, owner_id, status, priority) VALUES
  (1, 'Backend API fejlesztés', 'REST API implementálás Node.js-ben', '2025-01-15', '2025-02-15', 2, 'completed', 'high'),
  (1, 'Frontend komponensek', 'React komponensek készítése', '2025-02-16', '2025-03-30', 2, 'in_progress', 'high'),
  (2, 'Wireframe készítés', 'Kezdeti wireframe-ek Figma-ban', '2025-02-01', '2025-02-10', 3, 'completed', 'medium');

-- ✅ Demo adatok importálva!
```

**✅ CHECKPOINT:** Adatbázis kész, demo adatokkal

---

### FÁZIS 3: SUPABASE AUTH BEÁLLÍTÁSA (15 perc)

#### 3.1 Email Authentication Engedélyezése

**Dashboard → Authentication → Providers**

1. **Email** provider:
   - ✅ **Enable Email provider** (bekapcsolva)
   - **Confirm email:** ✅ (ajánlott)
   - **Secure email change:** ✅
2. Kattints: **Save**

#### 3.2 Email Templates Testreszabása (Opcionális)

**Dashboard → Authentication → Email Templates**

- **Confirmation** email
- **Invite** email
- **Magic Link** email
- **Change Email** email
- **Reset Password** email

Módosíthatod a sablonokat (HTML + változók)

#### 3.3 Demo Felhasználók Regisztrálása

**2 opció:**

**A) Manuális regisztráció (Dashboard):**
- Dashboard → Authentication → **Users** → **Add user**
- Email: `admin@example.com`
- Password: `password123`
- Auto Confirm: ✅

**B) Frontend-ről (később, amikor kész):**
- Regisztráció a frontend login oldalon

**✅ CHECKPOINT:** Supabase Auth konfigurálva

---

### FÁZIS 4: FRONTEND ÁTALAKÍTÁSA (60 perc)

**Ez a LEGNAGYOBB MUNKA!** Az egész frontend-et át kell írni.

#### 4.1 Supabase Client Telepítése

**Két opció:**

**A) CDN (egyszerűbb, ajánlott kezdőknek):**

```html
<!-- Supabase JS Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

**B) npm (fejlesztőknek):**

```bash
npm install @supabase/supabase-js
```

#### 4.2 Frontend Konfiguráció (index.html módosítás)

**RÉGI (ISPConfig verzió):**

```javascript
// Configuration
const hostname = window.location.hostname || 'localhost';
const API_URL = `http://${hostname}:3001/api`;
const SOCKET_URL = `http://${hostname}:3001`;

// Global state
let currentUser = null;
let authToken = null;
let socket = null;
```

**ÚJ (Supabase verzió):**

```javascript
// Supabase Configuration
const SUPABASE_URL = 'https://[PROJECT_REF].supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGc...'; // Public key

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global state
let currentUser = null;
let realtimeChannel = null;
```

#### 4.3 Authentication Átírása

**RÉGI (JWT + Express):**

```javascript
async function handleLogin(event) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  localStorage.setItem('authToken', data.data.token);
  currentUser = data.data.user;
}
```

**ÚJ (Supabase Auth):**

```javascript
async function handleLogin(event) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    showNotification('Bejelentkezési hiba: ' + error.message, 'error');
    return;
  }

  currentUser = data.user;
  // Session automatikusan tárolódik (localStorage)
  showNotification('Sikeres bejelentkezés!', 'success');
  loadDashboard();
}
```

#### 4.4 API Hívások Átírása

**RÉGI (Fetch API):**

```javascript
async function loadProjects() {
  const response = await fetch(`${API_URL}/projects`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  });
  const data = await response.json();
  projects = data.data;
}
```

**ÚJ (Supabase Client):**

```javascript
async function loadProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      owner:users!owner_id (
        id,
        name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Hiba a projektek betöltésekor:', error);
    return;
  }

  projects = data;
  renderProjects();
}
```

#### 4.5 CRUD Műveletek Átírása

**Projekt létrehozása (ÚJ):**

```javascript
async function saveProject(event) {
  event.preventDefault();

  const projectData = {
    name: document.getElementById('project-name').value,
    description: document.getElementById('project-description').value,
    start_date: document.getElementById('project-start-date').value,
    end_date: document.getElementById('project-end-date').value,
    owner_id: parseInt(document.getElementById('project-owner').value),
    status: document.getElementById('project-status').value,
    color: document.getElementById('project-color').value
  };

  if (editingProjectId) {
    // UPDATE
    const { data, error } = await supabase
      .from('projects')
      .update(projectData)
      .eq('id', editingProjectId)
      .select()
      .single();

    if (error) {
      showNotification('Hiba a projekt frissítésekor', 'error');
      return;
    }

    showNotification('Projekt sikeresen frissítve!', 'success');
  } else {
    // INSERT
    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();

    if (error) {
      showNotification('Hiba a projekt létrehozásakor', 'error');
      return;
    }

    showNotification('Projekt sikeresen létrehozva!', 'success');
  }

  // Realtime automatikusan frissíti a többi ablakot!
  loadProjects();
  closeProjectForm();
}
```

**Projekt törlése (ÚJ):**

```javascript
async function deleteProject(projectId) {
  if (!confirm('Biztosan törölni szeretnéd ezt a projektet?')) {
    return;
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    showNotification('Hiba a projekt törlésekor', 'error');
    return;
  }

  showNotification('Projekt sikeresen törölve!', 'success');
  loadProjects();
}
```

#### 4.6 Real-time Subscriptions (Socket.IO helyett)

**RÉGI (Socket.IO):**

```javascript
socket.on('project:created', (project) => {
  projects.push(project);
  renderProjects();
  showNotification('Új projekt létrehozva!', 'info');
});

socket.on('project:updated', (project) => {
  const index = projects.findIndex(p => p.id === project.id);
  if (index !== -1) {
    projects[index] = project;
    renderProjects();
  }
});
```

**ÚJ (Supabase Realtime):**

```javascript
// Realtime subscription feliratkozás
function subscribeToRealtimeUpdates() {
  // Projects channel
  realtimeChannel = supabase
    .channel('projects-tasks-channel')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'projects'
      },
      (payload) => {
        console.log('Project változás:', payload);

        if (payload.eventType === 'INSERT') {
          projects.push(payload.new);
          renderProjects();
          showNotification('Új projekt létrehozva!', 'info');
        } else if (payload.eventType === 'UPDATE') {
          const index = projects.findIndex(p => p.id === payload.new.id);
          if (index !== -1) {
            projects[index] = payload.new;
            renderProjects();
          }
        } else if (payload.eventType === 'DELETE') {
          projects = projects.filter(p => p.id !== payload.old.id);
          renderProjects();
          showNotification('Projekt törölve!', 'info');
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks'
      },
      (payload) => {
        console.log('Task változás:', payload);
        // Hasonló logika mint a projekteknél
        loadTasks();
      }
    )
    .subscribe();
}

// Bejelentkezés után hívd meg:
subscribeToRealtimeUpdates();

// Kijelentkezéskor:
function cleanup() {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
  }
}
```

**✅ CHECKPOINT:** Frontend átalakítva Supabase-re

---

### FÁZIS 5: NETLIFY DEPLOYMENT (25 perc)

#### 5.1 Frontend Előkészítése

**1. Git repository létrehozása (ha még nincs):**

```bash
cd /home/user/Project-koveto
git init
git add frontend/
git commit -m "Supabase frontend ready for Netlify"
```

**2. Frontend fájl struktúra:**

```
frontend/
├── index.html          # Fő alkalmazás (Supabase-re átírva)
├── _redirects          # Netlify routing config
└── netlify.toml        # Netlify build config (opcionális)
```

**3. _redirects fájl létrehozása:**

`frontend/_redirects`:
```
# SPA fallback (minden útvonal az index.html-re)
/*    /index.html   200
```

**4. netlify.toml létrehozása (opcionális):**

`frontend/netlify.toml`:
```toml
[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 5.2 Netlify Projekt Létrehozása

**1. Regisztráció és Bejelentkezés:**
- Látogass el: **https://www.netlify.com**
- Kattints: **Sign up** (vagy **Log in**)
- GitHub account használata (ajánlott)

**2. Új Site Létrehozása:**

**Opció A: Git-based Deploy (Ajánlott):**

1. Dashboard: **Add new site** → **Import an existing project**
2. **Connect to Git provider:** GitHub
3. Válaszd ki a repository-t: `Project-koveto`
4. Build settings:
   - **Branch to deploy:** `main` (vagy `master`)
   - **Base directory:** `frontend`
   - **Build command:** (üresen hagyható, nincs build)
   - **Publish directory:** `.` (vagy `frontend`)
5. **Environment variables:**
   - Key: `SUPABASE_URL`
   - Value: `https://[PROJECT_REF].supabase.co`
   - Key: `SUPABASE_ANON_KEY`
   - Value: `eyJhbGc...` (public key)
6. Kattints: **Deploy site**

**Várj 1-2 percet** → Site deployed!

**Opció B: Manual Deploy (Drag & Drop):**

1. Dashboard: **Sites** → **Add new site** → **Deploy manually**
2. Drag & drop a `frontend/` mappát
3. Várj 30 másodpercet → Deployed!

#### 5.3 Custom Domain Beállítása (Opcionális)

**1. Netlify Dashboard → Domain management**
2. **Add custom domain:** `projekt.sajatdomain.hu`
3. DNS beállítások (domain regisztrátorban):
   - **CNAME record:**
     - Name: `projekt`
     - Value: `[your-site].netlify.app`
4. Várj 5-60 percet (DNS propagáció)
5. Netlify automatikusan generálja az SSL certificate-et (Let's Encrypt)

**✅ CHECKPOINT:** Frontend deployed Netlify-ra, HTTPS működik

---

### FÁZIS 6: SUPABASE EDGE FUNCTIONS (Opcionális, 30 perc)

**Ha szükséged van backend logikára** (pl. email küldés, cron jobs):

#### 6.1 Edge Function Létrehozása

**Supabase Dashboard → Edge Functions → Create a new function**

**Példa: Email értesítés küldése (task assignment):**

```typescript
// supabase/functions/send-task-email/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { taskId, userId } = await req.json()

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Fetch task and user data
  const { data: task } = await supabaseClient
    .from('tasks')
    .select('*, project:projects(name), owner:users(name, email)')
    .eq('id', taskId)
    .single()

  // Send email (using Resend, SendGrid, or SMTP)
  // ...

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

**Deploy:**

```bash
supabase functions deploy send-task-email
```

#### 6.2 Database Triggers (Email Automation)

**SQL Editor:**

```sql
-- Trigger: Send email when task is assigned
CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Call Edge Function
  PERFORM net.http_post(
    url := 'https://[PROJECT_REF].supabase.co/functions/v1/send-task-email',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
    body := jsonb_build_object('taskId', NEW.id, 'userId', NEW.owner_id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_assignment_trigger
AFTER INSERT OR UPDATE OF owner_id ON tasks
FOR EACH ROW
WHEN (NEW.owner_id IS NOT NULL)
EXECUTE FUNCTION notify_task_assignment();
```

**✅ CHECKPOINT:** Edge Functions deployolva (ha szükséges)

---

### FÁZIS 7: TESZTELÉS (30 perc)

#### 7.1 Frontend Teszt

1. Nyisd meg: `https://[your-site].netlify.app`
2. **Elvárt:** Bejelentkezési oldal betöltődik
3. **Regisztráció tesztelése:**
   - Email: `test@example.com`
   - Jelszó: `TestPassword123!`
   - **Elvárt:** Email confirmation érkezik
4. **Bejelentkezés:**
   - Confirm email (kattints az emailben)
   - Login
   - **Elvárt:** Dashboard betöltődik

#### 7.2 CRUD Tesztek

- ✅ Projekt létrehozása
- ✅ Projekt módosítása
- ✅ Projekt törlése
- ✅ Feladat létrehozása
- ✅ Feladat státusz módosítása
- ✅ Naptár nézet

#### 7.3 Real-time Sync Teszt

1. Nyisd meg 2 böngésző ablakban ugyanazt az URL-t
2. Mindkettőben jelentkezz be (különböző userekkel)
3. Hozz létre egy projektet az egyik ablakban
4. **Elvárt:** A másik ablakban is azonnal megjelenik (Supabase Realtime)

#### 7.4 Console Hiba Ellenőrzés

- `F12` → Console
- **Nem lehet error!**

**✅ CHECKPOINT:** Minden működik, real-time sync OK

---

## 🐛 HIBAELHÁRÍTÁS (Supabase Specifikus)

### RLS Policy Hiba: "permission denied for table"

**Ok:** Row Level Security blokkolja a műveletet

```bash
# Supabase Dashboard → SQL Editor
# Ellenőrizd a policies-t:
SELECT * FROM pg_policies WHERE tablename = 'projects';

# Ideiglenes fix (csak fejlesztéshez!):
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

# Éles környezetben: Javítsd a policies-t
```

### Realtime Subscription Nem Működik

**Ok:** Tábla nincs engedélyezve Realtime-hoz

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
```

### CORS Hiba

**Ok:** Helytelen Supabase URL vagy API key

```javascript
// Ellenőrizd:
console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');

// Dashboard → Settings → API
// Másold be újra a helyes értékeket
```

### Auth Hiba: "Invalid login credentials"

**Ok:** Felhasználó nincs regisztrálva vagy email nincs confirmálva

```bash
# Dashboard → Authentication → Users
# Ellenőrizd a user státuszát
# Ha "Waiting for verification" → Confirm email manually
```

---

## 📊 MIGRATION CHECKLIST

**Ezt használd az átalakításhoz:**

### Backend Változások

- [ ] MySQL → PostgreSQL séma konverzió
- [ ] Express.js routes → Supabase client hívások
- [ ] JWT auth → Supabase Auth
- [ ] Socket.IO → Supabase Realtime subscriptions
- [ ] Custom API endpoints → Supabase Edge Functions (ha kell)
- [ ] bcrypt password hashing → Supabase Auth (beépített)
- [ ] Nodemailer → Supabase Edge Functions + Email provider

### Frontend Változások

- [ ] Fetch API calls → Supabase client
- [ ] localStorage JWT → Supabase session (automatikus)
- [ ] Socket.IO connection → Supabase Realtime channel
- [ ] API_URL config → SUPABASE_URL + SUPABASE_ANON_KEY
- [ ] Error handling → Supabase error format

### Deployment Változások

- [ ] PM2 → Nincs (serverless)
- [ ] Apache/Nginx → Netlify CDN
- [ ] SSL/TLS → Netlify automatikus HTTPS
- [ ] Domain DNS → CNAME to Netlify
- [ ] Environment variables → Netlify env vars

---

## 🎉 TELEPÍTÉS KÉSZ!

### Sikerkritériumok

- [ ] Supabase projekt létrehozva
- [ ] PostgreSQL séma importálva
- [ ] RLS policies beállítva
- [ ] Supabase Auth működik
- [ ] Frontend deployed Netlify-ra
- [ ] HTTPS működik (zöld lakat)
- [ ] Bejelentkezés sikeres
- [ ] CRUD műveletek működnek
- [ ] Real-time sync működik (2 ablak teszt)
- [ ] Nincs console error
- [ ] Email értesítések (opcionális) működnek

---

## 📚 TOVÁBBI INFORMÁCIÓK

### Hasznos Linkek

- **Supabase Docs:** https://supabase.com/docs
- **Supabase JS Client:** https://supabase.com/docs/reference/javascript
- **Netlify Docs:** https://docs.netlify.com
- **PostgreSQL Tutorial:** https://www.postgresql.org/docs/

### Következő Lépések

1. **Custom domain beállítása** (Netlify)
2. **Email provider konfiguráció** (Resend, SendGrid)
3. **Monitoring:** Supabase Dashboard Analytics
4. **Performance:** Supabase database indexes optimalizálás
5. **Backup:** Supabase auto-backup (Pro plan)

---

**Készítette:** Claude Code
**Verzió:** Supabase + Netlify 1.0
**Dátum:** 2025-10-26
**Support:** Supabase Discord, Netlify Support
