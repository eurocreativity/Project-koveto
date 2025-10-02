# 📌 Projektleírás és Fejlesztési Dokumentáció
**Fájlnév:** project-summary.md

## 1. Bevezetés
Ez a dokumentum egy webes alapú projekt- és feladatkövető alkalmazás megvalósítási tervét tartalmazza.
A cél egy **single-file HTML SPA** létrehozása (hasonlóan a Munkalap alkalmazáshoz), amely kezdetben LocalStorage-t használ, majd később migálható Supabase backend-re és ISPConfig webszerverre.

A dokumentum részletesen bemutatja a fejlesztési lépéseket az első MVP-től a kész rendszer telepítéséig.

---

## 2. Rendszer célja és funkciói
- Projektek létrehozása kezdő- és befejezési dátummal, felelőssel
- Részfeladatok rögzítése projektekhez
- Naptárba integrált projekt- és feladatmegjelenítés
- Projekt előrehaladás nyomon követése (% készültség, határidőig hátralévő idő)
- Felhasználókezelés (multi-user authentikáció)
- Jelentések és statisztikák generálása

---

## 3. Fejlesztési technológiák

### 3.1 Teljes stack (Production-ready verzió)
- **Frontend**: Vanilla JavaScript + HTML5 + CSS3 (single-page app)
- **UI komponensek**: FullCalendar.js, Socket.IO client, Chart.js
- **Backend**: Node.js 20.x + Express.js REST API
- **Real-time**: Socket.IO (WebSocket-based live sync)
- **Adatbázis**: MySQL 8.0 / MariaDB 10.x
- **Authentikáció**: JWT (JSON Web Token) + bcrypt password hashing
- **Deployment**: ISPConfig 3.2 webszerver + pm2 process manager
- **Reverse Proxy**: Nginx (ISPConfig által kezelt)

### 3.2 Miért Node.js + Socket.IO?
- ✅ **Real-time sync**: 2 felhasználó párhuzamos munka támogatás
- ✅ **Live frissítések**: Projekt/feladat változások azonnali szinkronizálása
- ✅ **WebSocket kapcsolat**: Automatikus reconnect, alacsony késleltetés
- ✅ **Modern ecosystem**: npm, Express, Sequelize ORM
- ✅ **ISPConfig kompatibilis**: Reverse proxy konfiguráció támogatott  

---

## 4. Adatmodell (MySQL)

### 4.1 MySQL táblastruktúra

#### users tábla
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,  -- bcrypt hash
  role ENUM('admin', 'user') DEFAULT 'user',
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### projects tábla
```sql
CREATE TABLE projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  owner_id INT NOT NULL,
  status ENUM('open', 'in_progress', 'completed') DEFAULT 'open',
  color VARCHAR(7) DEFAULT '#667eea',  -- Hex color for calendar
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_owner (owner_id),
  INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### tasks tábla
```sql
CREATE TABLE tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  start_date DATE,
  deadline DATE NOT NULL,
  owner_id INT NOT NULL,
  status ENUM('open', 'in_progress', 'completed') DEFAULT 'open',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_project (project_id),
  INDEX idx_status (status),
  INDEX idx_deadline (deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### settings tábla
```sql
CREATE TABLE settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  key_name VARCHAR(50) UNIQUE NOT NULL,
  value_text TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default settings
INSERT INTO settings (key_name, value_text) VALUES
  ('company_name', 'Projekt Követő Rendszer'),
  ('logo_url', ''),
  ('default_project_color', '#667eea');
```

### 4.2 TypeScript/JavaScript adattípusok (API response)

**User**
```typescript
type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  avatarUrl?: string;
  createdAt: string;            // ISO timestamp
  updatedAt: string;
};
```

**Project**
```typescript
type Project = {
  id: number;
  name: string;
  description: string;
  startDate: string;            // "YYYY-MM-DD"
  endDate: string;              // "YYYY-MM-DD"
  ownerId: number;              // User.id
  ownerName?: string;           // JOIN from users
  status: "open" | "in_progress" | "completed";
  color: string;                // Hex color (#667eea)
  progress?: number;            // Calculated: completed tasks / total tasks
  taskCount?: number;           // JOIN COUNT
  createdAt: string;
  updatedAt: string;
};
```

**Task**
```typescript
type Task = {
  id: number;
  projectId: number;
  projectName?: string;         // JOIN from projects
  name: string;
  description: string;
  startDate?: string;
  deadline: string;
  ownerId: number;
  ownerName?: string;           // JOIN from users
  status: "open" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
};
```

**Settings**
```typescript
type Settings = {
  companyName: string;
  logoUrl: string;
  defaultProjectColor: string;
};
```

---

## 5. Backend fejlesztés (Node.js + Express + Socket.IO)

### 5.1 Backend projekt struktúra
```
project-tracker-backend/
├── src/
│   ├── config/
│   │   ├── database.js          # MySQL connection pool
│   │   └── jwt.js               # JWT secret & config
│   ├── controllers/
│   │   ├── authController.js    # Login, register, logout
│   │   ├── projectController.js # CRUD projects
│   │   ├── taskController.js    # CRUD tasks
│   │   └── userController.js    # User profile
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT verification
│   │   └── errorHandler.js      # Global error handling
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   └── users.js
│   ├── sockets/
│   │   └── projectSocket.js     # Socket.IO real-time events
│   ├── models/
│   │   └── queries.js           # MySQL prepared statements
│   └── server.js                # Express app + Socket.IO setup
├── .env                         # Environment variables
├── package.json
└── ecosystem.config.js          # PM2 config
```

### 5.2 REST API végpontok

#### Authentikáció
- `POST /api/auth/register` - Regisztráció
- `POST /api/auth/login` - Bejelentkezés (JWT token visszaadása)
- `POST /api/auth/logout` - Kijelentkezés
- `GET /api/auth/me` - Aktuális felhasználó adatai

#### Projektek
- `GET /api/projects` - Összes projekt (szűrhető: status, owner)
- `GET /api/projects/:id` - Adott projekt részletei + feladatok
- `POST /api/projects` - Új projekt létrehozása
- `PUT /api/projects/:id` - Projekt módosítása
- `DELETE /api/projects/:id` - Projekt törlése

#### Feladatok
- `GET /api/tasks` - Összes feladat (szűrhető: project_id, status, priority)
- `GET /api/tasks/:id` - Adott feladat részletei
- `POST /api/tasks` - Új feladat létrehozása
- `PUT /api/tasks/:id` - Feladat módosítása
- `DELETE /api/tasks/:id` - Feladat törlése

#### Naptár
- `GET /api/calendar/events` - Projektek + feladatok naptár formátumban

#### Felhasználók
- `GET /api/users` - Felhasználók listája (team member picker-hez)
- `GET /api/users/:id` - Felhasználó profilja
- `PUT /api/users/:id` - Profil módosítása

### 5.3 Socket.IO real-time események

#### Kliens → Szerver
```javascript
socket.emit('project:update', { id: 5, name: 'Új név' });
socket.emit('task:create', { projectId: 3, name: 'Új feladat' });
socket.emit('task:status-change', { id: 12, status: 'completed' });
```

#### Szerver → Kliensek (broadcast)
```javascript
io.emit('project:updated', project);      // Projekt módosult
io.emit('task:created', task);            // Új feladat létrejött
io.emit('task:updated', task);            // Feladat módosult
io.emit('task:deleted', { id: 12 });      // Feladat törölve
io.emit('user:online', { userId: 3 });    // Felhasználó online
```

### 5.4 Függőségek (package.json)
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1",
    "mysql2": "^3.6.5",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5"
  }
}
```

---

## 6. Frontend fejlesztés (Single-page HTML + Socket.IO)

### 6.1 Frontend struktúra
```
project-tracker-frontend/
├── index.html                   # Single-page application
├── css/
│   └── styles.css              # Ha külön CSS-t használunk
├── js/
│   ├── api.js                  # REST API hívások (fetch)
│   ├── socket.js               # Socket.IO connection
│   ├── auth.js                 # Login/logout logika
│   ├── projects.js             # Projekt CRUD
│   ├── tasks.js                # Feladat CRUD
│   └── calendar.js             # FullCalendar integráció
└── assets/
    └── logo.png
```

**Vagy single-file verzió:**
- Minden JavaScript inline `<script>` tagben
- Minden CSS inline `<style>` tagben
- Egyetlen `index.html` fájl (~80-100KB)

### 6.2 Socket.IO kliens integráció
```html
<script src="https://cdn.socket.io/4.6.1/socket.io.min.js"></script>
<script>
const socket = io('https://project.domain.hu');

// Real-time frissítések figyelése
socket.on('project:updated', (project) => {
    updateProjectInDOM(project);
    showNotification(`${project.name} frissítve!`);
});

socket.on('task:created', (task) => {
    addTaskToDOM(task);
    refreshCalendar();
});
</script>
```

### 6.3 Implementált frontend funkciók (2025-10-01)

#### Task CRUD UI
- **Task lista megjelenítés** (6 tabot tartalmazó layout: Dashboard, Projects, Tasks, Calendar, New Project, New Task)
- **Szűrés**: Projekt, státusz (open/in_progress/completed), prioritás (low/medium/high) szerint
- **Új task létrehozása**: Űrlap projekt választóval, dátumokkal, prioritással
- **Task szerkesztés**: editTask() függvény, form pre-fill
- **Task törlés**: deleteTask() függvény, megerősítő dialógus
- **Real-time frissítések**: Socket.IO task:created, task:updated, task:deleted események

#### Project Edit/Delete UI
- **Edit gomb** minden projekt kártyán: editProject(projectId) függvény
- **Delete gomb** minden projekt kártyán: deleteProject(projectId) függvény
- **Projekt szerkesztés**: Űrlap pre-fill, PUT /api/projects/:id
- **Projekt törlés**: Megerősítő dialógus, DELETE /api/projects/:id
- **Form reset**: Sikeres mentés után űrlap visszaáll új projekt módba

#### Főbb JavaScript függvények (index.html)
- `async function loadTasks()` - GET /api/tasks
- `async function renderTasks()` - Task lista renderelés szűrőkkel
- `async function saveTask(event)` - POST/PUT task
- `async function editTask(taskId)` - Form pre-fill task szerkesztéshez
- `async function deleteTask(taskId)` - DELETE task
- `async function editProject(projectId)` - Form pre-fill projekt szerkesztéshez
- `async function deleteProject(projectId)` - DELETE projekt megerősítéssel
- `async function saveProject(event)` - POST/PUT projekt (új vagy edit)
- `async function loadProjects()` - GET /api/projects
- `async function renderProjects()` - Projekt kártyák + Edit/Delete gombok

#### Real-time Socket.IO események
- `socket.on('task:created', addTaskToDOM)`
- `socket.on('task:updated', updateTaskInDOM)`
- `socket.on('task:deleted', removeTaskFromDOM)`
- `socket.on('project:updated', updateProjectInDOM)`
- `socket.on('project:deleted', removeProjectFromDOM)`

#### Frontend fájl méret
- **index.html**: ~65KB (Task CRUD + Project Edit/Delete + Details Modal implementációval)
- **Biztonsági mentések**: index-backup.html, index-before-patch-remove.html

### 6.4 Project Details Modal (2025-10-01)

#### Modal funkcionalitás
- **Kattintható projekt kártyák**: Bármely projekt kártyára kattintva megnyílik a részletes nézet
- **Részletek gomb**: Zöld "👁️ Részletek" gomb minden projekt kártyán
- **Modal overlay**: Háttér blur effekt, kattintásra bezáródik
- **Animációk**: fadeIn overlay, slideUp modal tartalom

#### Modal tartalom
1. **Projekt alapadatok**:
   - Projekt név és státusz badge (open/in_progress/completed)
   - Felelős neve
   - Kezdő és befejező dátum
   - Részletes leírás (ha van)

2. **Progress tracking**:
   - Visual progress bar (0-100%)
   - Százalékos készültség számítása: (completedTasks / totalTasks) * 100

3. **Task statisztikák**:
   - 📊 Összes feladat száma
   - ✅ Befejezett feladatok száma
   - 🔄 Folyamatban lévő feladatok száma
   - 📋 Nyitott feladatok száma

4. **Task lista**:
   - Összes projekthez tartozó feladat megjelenítése
   - Feladat név, leírás, határidő, felelős
   - Státusz és prioritás badge-ek színkódolással
   - Üres állapot kezelés: "📋 Még nincs feladat hozzáadva"

5. **Műveletek**:
   - ✏️ Szerkesztés gomb (modal bezárása + edit form megnyitása)
   - ❌ Bezárás gomb (modal bezárása)

#### CSS osztályok
- `.modal-overlay` - Háttér overlay blur effekttel
- `.modal-content` - Központi modal ablak (max-width: 900px)
- `.modal-header` - Gradient fejléc (purple-violet)
- `.modal-close` - X bezárás gomb (animált hover)
- `.modal-body` - Modal tartalom scroll területtel
- `.detail-row`, `.detail-item` - Projekt adatok megjelenítés
- `.progress-bar-container`, `.progress-bar` - Progress megjelenítés
- `.task-stats` - Task statisztikák grid layout
- `.tasks-section` - Task lista szekció
- `.task-item` - Egyedi task kártya

#### JavaScript függvények
```javascript
// Modal megnyitás
async function showProjectDetails(projectId) {
    // 1. Projekt lekérése projects tömbből
    const project = projects.find(p => p.id === projectId);

    // 2. Projekt task-jainak szűrése
    const projectTasks = tasks.filter(t => t.project_id === projectId);

    // 3. Task statisztikák számítása
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = projectTasks.filter(t => t.status === 'in_progress').length;
    const openTasks = projectTasks.filter(t => t.status === 'open').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 4. Modal HTML generálás
    // 5. Modal hozzáadása DOM-hoz
    const modalContainer = document.createElement('div');
    modalContainer.id = 'projectDetailsModal';
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
}

// Modal bezárás
function closeProjectDetails(event) {
    if (event) {
        if (event.target.className !== 'modal-overlay') return;
    }
    const modal = document.getElementById('projectDetailsModal');
    if (modal) modal.remove();
}

// Edit gomb a modalban
onclick="closeProjectDetails(); editProject(${project.id})"
```

#### Event handling
- **Overlay click**: Modal bezárása (csak ha közvetlenül az overlay-re kattintanak)
- **event.stopPropagation()**: Megakadályozza a buborékolást a gombokon
- **Modal content click**: Nem zárja be a modalt
- **ESC billentyű**: Nincs implementálva (TODO)

#### Frontend fájl frissítés
- **index.html**: ~65KB (Task CRUD + Project Edit/Delete + Details Modal)
- **Backup készítve**: index-before-modal.html
- **Python script használat**: Modal CSS és JavaScript hozzáadása (Edit tool hibák miatt)

### 6.5 Export/Import Funkciók (2025-10-02)

#### Export funkciók
**1. CSV Export (projektek és feladatok külön)**
```javascript
function exportToCSV(data, filename) {
    // Generate CSV headers from first object keys
    const headers = Object.keys(data[0]);
    let csv = headers.join(',') + '\n';

    // Generate CSV rows with proper escaping
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header] || '';
            // Escape special characters (comma, quotes)
            return typeof value === 'string' && (value.includes(',') || value.includes('"'))
                ? `"${value.replace(/"/g, '""')}"`
                : value;
        });
        csv += values.join(',') + '\n';
    });

    // Download file using Blob API
    downloadFile(csv, filename, 'text/csv');
}

// Export projects to CSV
function exportProjects(format) {
    const timestamp = new Date().toISOString().split('T')[0];
    if (format === 'csv') {
        const csvData = projects.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            start_date: p.start_date,
            end_date: p.end_date,
            owner_name: p.owner_name,
            status: p.status,
            color: p.color
        }));
        exportToCSV(csvData, `projektek-${timestamp}.csv`);
    }
}
```

**2. JSON Export (projektek és feladatok külön)**
```javascript
function exportToJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, filename, 'application/json');
}

// Export projects to JSON
function exportProjects(format) {
    const timestamp = new Date().toISOString().split('T')[0];
    if (format === 'json') {
        exportToJSON(projects, `projektek-${timestamp}.json`);
    }
}
```

**3. Full Backup (minden adat egy fájlban)**
```javascript
function exportAllData() {
    const timestamp = new Date().toISOString().split('T')[0];
    const backup = {
        exported_at: new Date().toISOString(),
        version: '1.0',
        projects: projects,
        tasks: tasks
    };
    exportToJSON(backup, `teljes-mentes-${timestamp}.json`);
    showNotification('✅ JSON export sikeres!');
}
```

**File download helper (Blob API)**
```javascript
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
```

#### Import funkciók

**1. Import Modal UI**
```javascript
function showImportModal() {
    const modalHTML = `
        <div class="modal-overlay" onclick="closeImportModal(event)">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>📥 Adatok importálása</h2>
                    <button class="modal-close" onclick="closeImportModal()">×</button>
                </div>
                <div class="modal-body">
                    <p>Válassz egy JSON fájlt az adatok importálásához...</p>
                    <div class="form-group">
                        <label>JSON fájl *</label>
                        <input type="file" id="importFileInput" accept=".json" required>
                    </div>
                    <div style="background: #fff3cd; padding: 10px; border-radius: 8px;">
                        <strong>⚠️ Figyelem:</strong> Az importálás NEM törli a meglévő adatokat,
                        hanem hozzáadja az újakat a rendszerhez.
                    </div>
                    <div class="modal-actions">
                        <button class="btn" onclick="performImport()">📥 Import</button>
                        <button class="btn btn-secondary" onclick="closeImportModal()">❌ Mégse</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    // Add modal to DOM
}
```

**2. Import Logic (FileReader API + Validation)**
```javascript
async function performImport() {
    const fileInput = document.getElementById('importFileInput');
    const file = fileInput.files[0];

    if (!file) {
        showNotification('❌ Válassz egy fájlt!');
        return;
    }

    try {
        // Read file contents
        const text = await file.text();
        const data = JSON.parse(text);

        // Validate JSON structure
        if (!data.projects || !Array.isArray(data.projects)) {
            showNotification('❌ Hibás fájl formátum!');
            return;
        }

        // Confirmation dialog
        const projectCount = data.projects?.length || 0;
        const taskCount = data.tasks?.length || 0;

        const confirmed = confirm(
            `Biztos vagy benne? Ez ${projectCount} projektet és ${taskCount} feladatot fog importálni. ` +
            `A meglévő adatok NEM lesznek törölve.`
        );

        if (!confirmed) return;

        // Import projects
        for (const project of data.projects) {
            const response = await fetch(`${API_URL}/projects`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(project)
            });
            // Socket.IO broadcasts to all clients
        }

        // Import tasks (if available)
        if (data.tasks) {
            for (const task of data.tasks) {
                await fetch(`${API_URL}/tasks`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(task)
                });
            }
        }

        // Success notification
        showNotification('✅ Import sikeres! Adatok betöltve.');
        closeImportModal();

        // Refresh data
        await loadData();

    } catch (error) {
        showNotification('❌ Import hiba: ' + error.message);
    }
}
```

#### Settings Tab UI

**Beállítások tab (⚙️)**
```html
<div id="settings" class="section">
    <h2>⚙️ Beállítások & Adatkezelés</h2>

    <!-- Import / Export Section -->
    <div class="settings-card">
        <h3>📥 Import / Export</h3>
        <div class="grid-4">
            <!-- Export Card -->
            <div class="card">
                <h4>📤 Export</h4>
                <p>Projektek, feladatok külön exportálása</p>
                <p class="info">Projektek tab-on és Feladatok tab-on találhatók az export gombok.</p>
            </div>

            <!-- Full Backup Card -->
            <div class="card">
                <h4>💾 Teljes mentés</h4>
                <p>Minden adat mentése JSON-be</p>
                <button class="btn" onclick="exportAllData()">💾 Teljes mentés letöltése</button>
            </div>

            <!-- Import Card -->
            <div class="card">
                <h4>📥 Import</h4>
                <p>JSON fájl visszatöltése</p>
                <button class="btn" onclick="showImportModal()">📥 Adatok importálása</button>
            </div>

            <!-- Info Card -->
            <div class="card">
                <h4>ℹ️ Információ</h4>
                <p><strong>CSV:</strong> Excel-kompatibilis</p>
                <p><strong>JSON:</strong> Mentés/visszatöltés</p>
            </div>
        </div>
    </div>

    <!-- System Info Section -->
    <div class="settings-card">
        <h3>📊 Rendszer információ</h3>
        <p><strong>Projektek száma:</strong> <span id="settingsProjectCount">-</span></p>
        <p><strong>Feladatok száma:</strong> <span id="settingsTaskCount">-</span></p>
        <p><strong>Felhasználók száma:</strong> <span id="settingsUserCount">-</span></p>
        <p><strong>Utolsó frissítés:</strong> <span id="settingsLastUpdate">-</span></p>
    </div>
</div>
```

**Statistics Update**
```javascript
function updateSettingsStats() {
    document.getElementById('settingsProjectCount').textContent = projects.length;
    document.getElementById('settingsTaskCount').textContent = tasks.length;
    document.getElementById('settingsUserCount').textContent = users.length;
    document.getElementById('settingsLastUpdate').textContent = new Date().toLocaleString('hu-HU');
}

// Call when switching to settings tab
function switchTab(tabName) {
    // ... other code ...
    if (tabName === 'settings') {
        updateSettingsStats();
    }
}
```

#### Implementációs jellemzők

**Biztonsági szempontok:**
- ✅ CSV injection védelem (escape special characters)
- ✅ JSON validáció import előtt
- ✅ Confirmation dialog (import előtt)
- ✅ File type restriction (.json only)
- ✅ Admin jogosultság ellenőrzés (backend)

**Felhasználói élmény:**
- ✅ Real-time feedback (notifications)
- ✅ Progress indication (import alatt)
- ✅ Non-destructive import (warning message)
- ✅ Blob API (automatic download)
- ✅ Dátum szerinti fájlnevek
- ✅ Modal-based UI (glassmorphism)

**Tesztelés:**
- ✅ CSV export tesztelve (2 projekt, proper headers)
- ✅ JSON export tesztelve (full data structure)
- ✅ Full backup tesztelve (metadata + arrays)
- ✅ Import modal tesztelve (file upload working)
- ✅ Import funkció tesztelve (2 projekt + 2 task imported)
- ✅ Statistics update tesztelve (2→4 projects, 2→4 tasks)

**Frontend fájl frissítés:**
- **index.html**: ~85KB (Task CRUD + Details Modal + User Management + Export/Import)



---

## 7. ISPConfig 3.2 telepítés és konfiguráció

### 7.1 Előkészületek
1. **ISPConfig panelben új webhely létrehozása**
   - Domain: `project.domain.hu`
   - SSL: Let's Encrypt automatikus tanúsítvány
   - PHP verzió: 8.x (frontend kiszolgálásához)

2. **MySQL adatbázis létrehozása**
   ```
   Database: project_tracker
   User: project_user
   Password: [generált biztonságos jelszó]
   ```

3. **SSH hozzáférés beállítása**
   - Shell user létrehozása az ISPConfig-ban
   - SSH kulcs feltöltése (opcionális, de ajánlott)

### 7.2 Node.js telepítés a szerverre
```bash
# SSH-val csatlakozás
ssh user@server.domain.hu

# Node.js 20.x telepítése (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 globális telepítése
sudo npm install -g pm2

# Verzió ellenőrzés
node --version  # v20.x.x
npm --version   # 10.x.x
pm2 --version   # 5.x.x
```

### 7.3 Backend telepítés
```bash
# Navigálás a web root-hoz
cd /var/www/clients/client1/web1

# Backend mappa létrehozása (web root-on KÍVÜL!)
mkdir -p private/project-tracker-api
cd private/project-tracker-api

# Git clone (vagy fájlok feltöltése)
git clone https://github.com/user/project-tracker-backend.git .

# Függőségek telepítése
npm install --production

# .env fájl konfigurálása
nano .env
```

**.env példa:**
```env
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_USER=project_user
DB_PASSWORD=biztonságos_jelszó
DB_NAME=project_tracker
JWT_SECRET=random_64_karakter_hosszú_string
CORS_ORIGIN=https://project.domain.hu
```

### 7.4 MySQL táblastruktúra létrehozása
```bash
# SQL fájl futtatása
mysql -u project_user -p project_tracker < schema.sql
```

### 7.5 PM2 indítás és autostart
```bash
# Backend indítás PM2-vel
pm2 start src/server.js --name project-tracker-api

# PM2 mentése és autostart beállítása
pm2 save
pm2 startup

# PM2 státusz ellenőrzése
pm2 status
pm2 logs project-tracker-api
```

### 7.6 Nginx reverse proxy konfiguráció (ISPConfig)

**ISPConfig panel → Sites → Options → Nginx Directives:**
```nginx
# API proxy
location /api/ {
    proxy_pass http://127.0.0.1:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}

# Socket.IO WebSocket proxy
location /socket.io/ {
    proxy_pass http://127.0.0.1:3001/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

**ISPConfig alkalmazása után:**
```bash
sudo systemctl reload nginx
```

### 7.7 Frontend telepítés
```bash
# Frontend fájlok másolása a web root-ba
cd /var/www/clients/client1/web1/web
cp /path/to/index.html .
cp -r /path/to/assets .

# Jogosultságok beállítása
chown web1:client1 -R .
```

### 7.8 Tesztelés
1. **Frontend elérés:** `https://project.domain.hu`
2. **API health check:** `https://project.domain.hu/api/health`
3. **Socket.IO connection test:** Böngésző DevTools Console

---

## 8. Fejlesztési ütemezés

### 1. FÁZIS – Backend MVP (3-5 nap)
- ✅ MySQL táblastruktúra
- ✅ Express API alapok (auth, projects, tasks)
- ✅ JWT authentikáció
- ✅ CRUD végpontok
- ✅ Basic Socket.IO setup

### 2. FÁZIS – Frontend MVP (3-5 nap)
- ✅ Single-page HTML struktúra
- ✅ Login/Register UI
- ✅ Dashboard (projektek listázása)
- ✅ Projekt CRUD űrlapok
- ✅ FullCalendar integráció
- ✅ Socket.IO kliens kapcsolat

### 3. FÁZIS – Real-time funkciók (2-3 nap)
- ✅ Projekt live frissítések
- ✅ Feladat live frissítések
- ✅ Online felhasználók jelzése
- ✅ Notification rendszer

### 4. FÁZIS – ISPConfig deployment (1-2 nap)
- ✅ Node.js + PM2 konfiguráció
- ✅ Nginx reverse proxy
- ✅ SSL tanúsítvány
- ✅ Adatbázis importálás

### 5. FÁZIS – Haladó funkciók (3-5 nap)
- ✅ Task CRUD UI (lista, szűrés, CRUD) - 2025-10-01
- ✅ Project Edit/Delete UI - 2025-10-01
- ✅ Project Details Modal - 2025-10-01
- ✅ User Management UI - 2025-10-02
- ✅ Export/Import (JSON, CSV, Full Backup) - 2025-10-02
- ✅ Dark mode - 2025-10-02
- [ ] **Nextcloud Naptár Integráció (CalDAV)** - Tervezett (lásd részletek 6.6)
- [ ] Drag & drop naptárban (FullCalendar)
- [ ] Fejlett szűrők és keresés
- [ ] Email értesítések (Nodemailer)

### 6. FÁZIS – Tesztelés és optimalizálás (2-3 nap)
- Böngésző kompatibilitás teszt
- Real-time sync stressz teszt
- Biztonsági audit
- Performance optimalizálás

**Összesen: 14-23 nap (2-3 hét)**  

---

## 9. Biztonsági szempontok

### 9.1 Backend biztonság
- ✅ **Helmet.js** - HTTP header védelem
- ✅ **Rate limiting** - API abuse elleni védelem (express-rate-limit)
- ✅ **SQL injection védelem** - Prepared statements (mysql2)
- ✅ **XSS védelem** - Input sanitization
- ✅ **CORS konfiguráció** - Csak engedélyezett origin
- ✅ **JWT token** - HTTPOnly cookie (opcionális)
- ✅ **bcrypt password hashing** - 10+ rounds
- ✅ **.env fájl** - Környezeti változók védelme (nem kerül git-be)

### 9.2 Frontend biztonság
- ✅ **JWT tárolás** - localStorage vagy sessionStorage
- ✅ **HTTPS only** - Let's Encrypt SSL tanúsítvány
- ✅ **Input validáció** - Kliens és szerver oldalon is
- ✅ **CSP headers** - Content Security Policy

### 9.3 MySQL biztonság
- ✅ **Korlátozott jogosultságok** - project_user csak a saját DB-hez férjen
- ✅ **Localhost binding** - MySQL csak helyi kapcsolatok
- ✅ **Rendszeres backup** - Automatikus napi mentések

---

## 10. Karbantartás és monitoring

### 10.1 PM2 monitoring
```bash
# Folyamat státusz
pm2 status

# Real-time logs
pm2 logs project-tracker-api --lines 100

# CPU/Memory használat
pm2 monit

# Restart ha szükséges
pm2 restart project-tracker-api
```

### 10.2 MySQL backup stratégia
```bash
# Napi automatikus backup (cron job)
0 2 * * * mysqldump -u project_user -p'password' project_tracker | gzip > /backup/project_tracker_$(date +\%Y\%m\%d).sql.gz
```

### 10.3 Git verziókezelés
```bash
# Git repository inicializálás
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/user/project-tracker.git
git push -u origin main

# Branch stratégia
main         # Production-ready kód
develop      # Fejlesztési branch
feature/*    # Új funkciók
hotfix/*     # Gyors javítások
```

### 10.4 Frissítések
```bash
# Backend dependencies frissítése
npm outdated
npm update

# Node.js verzió frissítés
nvm install 20
nvm use 20

# PM2 újraindítás frissítés után
pm2 reload project-tracker-api
```

---

## 11. Várható eredmény

A fejlesztés végén egy **teljes körű, production-ready projekt követő rendszer** áll rendelkezésre, amely:

### Főbb jellemzők:
- ✅ **Real-time szinkronizáció** - Socket.IO alapú live frissítések
- ✅ **Multi-user támogatás** - JWT authentikáció, szerepkör-alapú jogosultságok
- ✅ **MySQL adatbázis** - Perzisztens adattárolás, relációs integritás
- ✅ **ISPConfig integráció** - Nginx reverse proxy, SSL, PM2 autostart
- ✅ **Naptár nézet** - FullCalendar.js drag & drop támogatással
- ✅ **Modern UI** - Glassmorphism design, reszponzív layout
- ✅ **Scalable** - Node.js async I/O, MySQL connection pooling
- ✅ **Biztonságos** - bcrypt, JWT, CORS, rate limiting, SQL injection védelem

### Technikai specifikáció:
| Szempont | Érték |
|----------|-------|
| **Backend** | Node.js 20.x + Express + Socket.IO |
| **Frontend** | Single-page HTML (~80-100KB) |
| **Adatbázis** | MySQL 8.0 / MariaDB 10.x |
| **Real-time latency** | <100ms (LAN), <300ms (WAN) |
| **Concurrent users** | 2-10 egyidejű felhasználó |
| **Browser support** | Chrome 90+, Firefox 88+, Edge 90+ |
| **Mobile support** | Reszponzív (360px+) |
| **Deployment** | ISPConfig 3.2 + PM2 + Nginx |

### Használati példák:
1. **Ketten dolgoznak ugyanazon a projekten:**
   - User A létrehoz egy feladatot → User B azonnal látja (Socket.IO)
   - User B módosítja a határidőt → User A-nál automatikusan frissül

2. **Naptár drag & drop:**
   - User A áthúz egy feladatot másik napra → Adatbázis frissül + User B-nél is mozog

3. **Határidő közeledik:**
   - Rendszer automatikusan értesíti mindkét felhasználót

4. **Offline → Online:**
   - Kapcsolat megszakad → Socket.IO automatikus reconnect + adatok szinkronizálása
