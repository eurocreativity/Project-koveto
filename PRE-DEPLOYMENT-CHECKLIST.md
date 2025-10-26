# ✅ PRE-DEPLOYMENT CHECKLIST
## Telepítés Előtti Ellenőrző Lista

**Kitöltés dátuma:** _______________________
**Kitöltő neve:** _______________________

---

## 📋 1. SZERVER INFORMÁCIÓK

### Szerver Hozzáférés
- [ ] Szerver IP cím: `_______________________________________`
- [ ] SSH port: `_______________________________________` (alap: 22)
- [ ] SSH user (root): `_______________________________________`
- [ ] SSH jelszó/key: `_______________________________________`
- [ ] SSH csatlakozás tesztelve: `ssh root@ip-cím`

### ISPConfig Admin
- [ ] ISPConfig URL: `https://___________________:8080`
- [ ] Admin felhasználónév: `_______________________________________`
- [ ] Admin jelszó: `_______________________________________`
- [ ] ISPConfig bejelentkezés tesztelve
- [ ] ISPConfig verzió: `_______________________________________` (elvárt: 3.2.9p vagy újabb)

### Szerver Specifikáció
- [ ] Operációs rendszer: `_______________________________________`
  - ✅ Ubuntu 20.04/22.04 LTS
  - ✅ Debian 11/12
  - ❌ Más (nem támogatott)
- [ ] RAM: `_______ GB` (minimum 2 GB)
- [ ] HDD szabad hely: `_______ GB` (minimum 10 GB)
- [ ] CPU mag(ok): `_______`

---

## 🌐 2. DOMAIN ÉS DNS

### Domain Információk
- [ ] Domain név: `_______________________________________`
  - Példa: `projekt.sajatdomain.hu`
- [ ] Weboldal típus: `_______________________________________`
  - ✅ Subdomain (projekt.sajatdomain.hu)
  - ✅ Domain (sajatdomain.hu)
  - ✅ Addon domain

### DNS Beállítások
- [ ] A record beállítva a domain regisztrátornál
  - Domain: `_______________________________________`
  - Cél IP: `_______________________________________`
- [ ] DNS propagáció ellenőrzése:
  ```bash
  dig +short projekt.sajatdomain.hu
  # VAGY
  nslookup projekt.sajatdomain.hu
  ```
  - Visszaadott IP: `_______________________________________`
  - ✅ Megegyezik a szerver IP-vel
  - ❌ Nem egyezik (várj 5-60 percet)

---

## 🔐 3. SZERVER ELŐKÉSZÍTÉS

### Node.js Ellenőrzése
- [ ] Node.js telepítve:
  ```bash
  node -v
  ```
  - ✅ v20.x.x
  - ❌ Nincs telepítve (telepítés szükséges)
  - ❌ Régebbi verzió (frissítés szükséges)

- [ ] npm telepítve:
  ```bash
  npm -v
  ```
  - ✅ 10.x.x
  - ❌ Nincs telepítve

### PM2 Ellenőrzése
- [ ] PM2 telepítve:
  ```bash
  pm2 -v
  ```
  - ✅ 5.x.x
  - ❌ Nincs telepítve (telepítés szükséges)

### MySQL/MariaDB Ellenőrzése
- [ ] MySQL/MariaDB fut:
  ```bash
  systemctl status mysql
  # VAGY
  systemctl status mariadb
  ```
  - ✅ active (running)
  - ❌ Nem fut (indítás szükséges)

- [ ] MySQL root jelszó ismert: `_______________________________________`

### Nginx Ellenőrzése
- [ ] Nginx fut:
  ```bash
  systemctl status nginx
  ```
  - ✅ active (running)
  - ❌ Nem fut (indítás szükséges)

- [ ] Nginx verzió:
  ```bash
  nginx -v
  ```
  - Verzió: `_______________________________________`

---

## 🔥 4. TŰZFAL ÉS PORTOK

### UFW Állapot
- [ ] UFW engedélyezve:
  ```bash
  ufw status
  ```
  - ✅ Status: active
  - ⚠️ Status: inactive (engedélyezés szükséges)

### Szükséges Portok
- [ ] Port 22 (SSH) nyitva
- [ ] Port 80 (HTTP) nyitva
- [ ] Port 443 (HTTPS) nyitva
- [ ] Port 8080 (ISPConfig) nyitva
- [ ] Port 3001 (Backend) **ZÁRVA** (csak localhost)

Ellenőrzés:
```bash
ufw status numbered
```

---

## 📂 5. FÁJLOK ÉS ADATBÁZIS

### Projekt Fájlok
- [ ] Backend fájlok rendelkezésre állnak (lokális gép)
  - Hely: `_______________________________________`
  - Méret: `_______ MB`
- [ ] Frontend fájlok rendelkezésre állnak
  - Hely: `_______________________________________`
  - Méret: `_______ KB`
- [ ] SQL fájlok rendelkezésre állnak
  - schema.sql: `_______________________________________`
  - seed-demo-data.sql (opcionális): `_______________________________________`

### Git Repository (Opcionális)
- [ ] Git repository elérhető:
  ```bash
  git clone https://github.com/eurocreativity/Project-koveto.git
  ```
  - ✅ Sikeres
  - ❌ Hiba (használj SCP/SFTP-t)

---

## 🔒 6. BIZTONSÁGI ELŐKÉSZÍTÉS

### SSL Certificate
- [ ] Let's Encrypt használata tervezett
  - ✅ Igen (automatikus SSL)
  - ❌ Nem (saját SSL certificate szükséges)

### Jelszavak Előkészítése
- [ ] MySQL user jelszó generálása előkészítve (ISPConfig generálja)
- [ ] JWT Secret generálása előkészítve:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  - Generált secret: `_______________________________________`

### Email Konfiguráció (Opcionális)
- [ ] Email értesítések használata tervezett
  - ✅ Igen
  - ❌ Nem (később beállítható)

Ha IGEN:
- [ ] SMTP szerver: `_______________________________________`
- [ ] SMTP user: `_______________________________________`
- [ ] SMTP jelszó: `_______________________________________`
- [ ] Gmail App Password létrehozva (ha Gmail):
  - Google Account → Security → 2-Step → App passwords

---

## 🧪 7. TESZT FELHASZNÁLÓK

### Demo Adatok
- [ ] Demo adatok importálása tervezett
  - ✅ Igen (seed-demo-data.sql)
  - ❌ Nem (saját adatok)

### Demo Felhasználók (Ha használod)
- Admin: `admin@example.com` / `password123`
- User 1: `janos@example.com` / `password123`
- User 2: `anna@example.com` / `password123`

---

## 💾 8. MENTÉS

### Meglévő Adatok Mentése
- [ ] ISPConfig teljes mentés készítve:
  ```bash
  /usr/local/ispconfig/server/scripts/ispconfig_backup.sh
  ```
- [ ] Mentés helye: `_______________________________________`
- [ ] Mentés mérete: `_______ MB`
- [ ] Mentés tesztelve (kicsomagolható)

---

## 📝 9. DOKUMENTÁCIÓ ÁTTEKINTVE

- [ ] PRODUCTION-DEPLOYMENT-PLAN.md elolvasva
- [ ] DEPLOYMENT-STEP-BY-STEP.md elolvasva (opcionális)
- [ ] Backend README.md elolvasva
- [ ] Nginx directives bemásolásra készen

---

## ⏰ 10. IDŐZÍTÉS

### Tervezett Telepítési Időpont
- [ ] Dátum: `_______________________________________`
- [ ] Időpont: `_______________________________________`
- [ ] Időtartam: `~100 perc` (1 óra 40 perc)
- [ ] Downtime tervezett: `_______________________________________`
  - ⚠️ Ha meglévő oldalt cserélsz le

### Backup Időpont
- [ ] Backup időpont: `_______________________________________`
- [ ] Backup tesztelve

---

## ✅ ÖSSZESÍTÉS

### Minden Előfeltétel Teljesül?
- [ ] **IGEN** - Folytathatom a telepítést
- [ ] **NEM** - Hiányzó elemek pótlása szükséges

### Hiányzó Elemek (Ha NEM):
1. _______________________________________
2. _______________________________________
3. _______________________________________

---

## 🚀 KÖVETKEZŐ LÉPÉS

Ha minden előfeltétel teljesül:
1. Nyisd meg: **PRODUCTION-DEPLOYMENT-PLAN.md**
2. Kezdd el a **2. SZERVER KÖRNYEZET BEÁLLÍTÁSA** fejezettel
3. Kövesd lépésről lépésre az utasításokat

---

## 📞 SUPPORT

- **Projekt dokumentáció:** `/home/user/Project-koveto/`
- **GitHub Issues:** https://github.com/eurocreativity/Project-koveto/issues

---

**Kitöltve:** ☐ Igen ☐ Nem
**Aláírás:** _______________________
**Dátum:** _______________________
