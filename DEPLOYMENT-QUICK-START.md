# ⚡ Quick Start - ISPConfig Deployment

**Domain:** project.euro-creativity.com
**Becsült idő:** 90-120 perc
**Részletes útmutató:** [DEPLOY-ISPCONFIG-PROJECT-EURO-CREATIVITY.md](DEPLOY-ISPCONFIG-PROJECT-EURO-CREATIVITY.md)

---

## 📋 Gyors Checklist

### Előkészítés (10 perc)
```bash
# SSH bejelentkezés
ssh root@your-server-ip

# Rendszer frissítés
apt update && apt upgrade -y

# Ellenőrzések
apache2 -v    # Apache 2.4.x
php -v        # PHP 7.4+ vagy 8.x
mysql -V      # MySQL 8.0 vagy MariaDB 10.x
node -v       # v20.x.x (vagy telepítjük)
```

---

### Node.js + PM2 Telepítés (10 perc)
```bash
# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs build-essential

# PM2
npm install -g pm2
pm2 startup systemd  # Futtasd le a kiírt parancsot!
```

---

### ISPConfig Setup (10 perc)

**Admin Panel:** https://your-server-ip:8080

**Website létrehozása:**
- Domain: `project.euro-creativity.com`
- SSL: ☑ Let's Encrypt
- PHP: PHP-FPM
- Auto-subdomain: www

**Database létrehozása:**
- Name: `project_tracker`
- User: `project_user`
- Password: `[Generálj erős jelszót]`

---

### Kód Deployment (15 perc)

```bash
# Navigálj a web könyvtárba (cseréld a client/web számot!)
cd /var/www/clients/client1/web5

# Backend clone
cd private
mkdir backend && cd backend
git clone https://github.com/eurocreativity/Project-koveto.git .

# Frontend másolás
cp -r frontend/* ../../web/projekt-koveto/

# Dependencies
cd backend
npm install --production
```

---

### Konfiguráció (15 perc)

**1. .env fájl létrehozása:**
```bash
cd /var/www/clients/client1/web5/private/backend/backend
nano .env
```

```bash
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_USER=c1_project_user
DB_PASSWORD=YOUR_PASSWORD_HERE
DB_NAME=c1_project_tracker
JWT_SECRET=$(openssl rand -base64 64)
CORS_ORIGIN=https://project.euro-creativity.com
```

**2. Database import:**
```bash
mysql -u c1_project_user -p c1_project_tracker < schema.sql
mysql -u c1_project_user -p c1_project_tracker < seed-demo-data.sql
```

**3. PM2 indítás:**
```bash
pm2 start ecosystem.config.js --env production
pm2 save
```

---

### Apache Reverse Proxy (10 perc)

**ISPConfig → Sites → project.euro-creativity.com → Options → Apache Directives:**

```apache
<IfModule mod_proxy.c>
    ProxyPreserveHost On
    ProxyRequests Off

    ProxyPass /api http://127.0.0.1:3001/api
    ProxyPassReverse /api http://127.0.0.1:3001/api

    ProxyPass /socket.io http://127.0.0.1:3001/socket.io
    ProxyPassReverse /socket.io http://127.0.0.1:3001/socket.io

    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /socket.io/(.*) ws://127.0.0.1:3001/socket.io/$1 [P,L]
</IfModule>
```

**Apache restart:**
```bash
a2enmod proxy proxy_http proxy_wstunnel rewrite
systemctl restart apache2
```

---

### Frontend Konfiguráció (5 perc)

```bash
cd /var/www/clients/client1/web5/web/projekt-koveto

# API_URL módosítása
sed -i "s|const API_URL = 'http://localhost:3001/api'|const API_URL = '/api'|g" index.html
```

---

### Tesztelés (5 perc)

```bash
# Backend API
curl https://project.euro-creativity.com/api/health

# Browser
# https://project.euro-creativity.com
# Login: janos@example.com / Admin123
```

---

## ✅ Gyors Ellenőrző Lista

- [ ] PM2 fut (`pm2 status`)
- [ ] API health check OK
- [ ] Frontend betölt (HTTPS)
- [ ] Login működik
- [ ] Dashboard megjelenik
- [ ] WebSocket kapcsolat él (DevTools → Network → WS)

---

## 🚨 Gyors Hibaelhárítás

**502 Bad Gateway:**
```bash
pm2 restart project-tracker-api
systemctl restart apache2
```

**Login fail:**
```bash
# Jelszó reset (Admin123)
mysql -u c1_project_user -p c1_project_tracker -e "
UPDATE users SET password_hash = '\$2b\$10\$F9VtkoLOFa/SthhNxP30WuEoyLUhJYGtOQGwqfB4ICRrlFQ7Wt.7y';
"
```

**WebSocket nem működik:**
```bash
a2enmod proxy_wstunnel
systemctl restart apache2
```

---

## 📚 Részletes Dokumentáció

- **Teljes deployment guide:** [DEPLOY-ISPCONFIG-PROJECT-EURO-CREATIVITY.md](DEPLOY-ISPCONFIG-PROJECT-EURO-CREATIVITY.md)
- **Troubleshooting:** Lásd fenti dokumentum "Troubleshooting Guide" fejezet
- **Security:** [SECURITY-AUDIT-2025-10-29.md](SECURITY-AUDIT-2025-10-29.md)
- **Testing:** [TEST-RESULTS-FINAL.md](TEST-RESULTS-FINAL.md)

---

**Ha elakadtál, nézd meg a részletes útmutatót!**
