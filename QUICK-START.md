# 🚀 Projekt Követő - Gyors Indítási Útmutató

## 📦 Gyors áttekintés

Ez egy **real-time projekt követő rendszer** Socket.IO alapú szinkronizációval.

- **Backend:** Node.js + Express + Socket.IO + MySQL
- **Frontend:** Single-page HTML + FullCalendar
- **Tesztelés:** 28 Playwright teszt (mind PASSED ✅)

---

## ⚡ 3 lépésben elindítás

### 1️⃣ Backend indítása
```bash
cd "f:\AI\Project koveto\backend"
node test-server.js
```
✅ API elérhető: http://localhost:3001

### 2️⃣ Frontend indítása
```bash
cd "f:\AI\Project koveto\frontend"
python -m http.server 8000
```
✅ Alkalmazás elérhető: http://localhost:8000

### 3️⃣ Bejelentkezés
- Email: **janos@example.com**
- Jelszó: **password123**

---

## 🧪 Real-time teszt (2 felhasználó)

1. Nyisd meg: http://localhost:8000 (2 böngésző tabban)
2. Mindkettőben jelentkezz be
3. Hozz létre új projektet az egyikben
4. ✅ A másikban azonnal megjelenik!

---

## 🛠️ Tesztek futtatása

### REST API tesztek (20 teszt)
```bash
cd "f:\AI\Project koveto\backend"
npx playwright test api-tests.spec.js --reporter=list
```

### Socket.IO tesztek (8 teszt)
```bash
cd "f:\AI\Project koveto\backend"
npx playwright test socket-tests.spec.js --reporter=list
```

---

## 📁 Projekt struktúra

```
f:\AI\Project koveto/
├── backend/                 # Node.js API szerver
│   ├── src/                # Forráskód
│   ├── test-server.js      # Mock API (MySQL nélkül)
│   ├── api-tests.spec.js   # REST API tesztek
│   └── socket-tests.spec.js # Socket.IO tesztek
├── frontend/
│   └── index.html          # Single-page alkalmazás
├── project-summary.md      # Teljes dokumentáció
├── SESSION-STATUS.md       # Fejlesztési állapot
└── QUICK-START.md          # Ez a fájl
```

---

## 🎯 Főbb funkciók

✅ Multi-user authentikáció (JWT)
✅ Projekt CRUD műveletek
✅ Task kezelés
✅ Real-time szinkronizáció (Socket.IO)
✅ FullCalendar naptár integráció
✅ Glassmorphism UI design
✅ 28 automatikus teszt

---

## 🔗 Hasznos linkek

- **Frontend:** http://localhost:8000
- **Backend API:** http://localhost:3001
- **Health check:** http://localhost:3001/api/health
- **Teljes dokumentáció:** [project-summary.md](./project-summary.md)
- **Fejlesztési állapot:** [SESSION-STATUS.md](./SESSION-STATUS.md)

---

## 👥 Demo felhasználók

| Email | Jelszó | Szerepkör |
|-------|--------|-----------|
| janos@example.com | password123 | user |
| anna@example.com | password123 | user |
| admin@example.com | password123 | admin |

---

## 📞 API végpontok

### Auth
- `POST /api/auth/register` - Regisztráció
- `POST /api/auth/login` - Bejelentkezés
- `GET /api/auth/me` - Aktuális user

### Projects
- `GET /api/projects` - Projektek listája
- `POST /api/projects` - Új projekt
- `PUT /api/projects/:id` - Módosítás
- `DELETE /api/projects/:id` - Törlés

### Tasks
- `GET /api/tasks` - Feladatok listája
- `POST /api/tasks` - Új feladat
- `PUT /api/tasks/:id` - Módosítás
- `DELETE /api/tasks/:id` - Törlés

---

## 🐛 Probléma esetén

### Backend nem indul
```bash
cd "f:\AI\Project koveto\backend"
npm install
node test-server.js
```

### Frontend nem érhető el
```bash
cd "f:\AI\Project koveto\frontend"
python -m http.server 8000
```

### Port foglalt
- Backend: Változtasd meg a `PORT` env változót (default: 3001)
- Frontend: Használj másik portot: `python -m http.server 8080`

---

**Élvezd a fejlesztést!** 🚀
