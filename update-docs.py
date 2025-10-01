#!/usr/bin/env python
# -*- coding: utf-8 -*-
import re

# Read project-summary.md
with open('project-summary.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the section after Socket.IO and add new section
socket_section_end = content.find('</script>\n```\n\n---\n\n## 7. ISPConfig')

if socket_section_end != -1:
    insertion_point = socket_section_end + len('</script>\n```')
    new_section = """

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
- **index.html**: ~60KB (Task CRUD + Project Edit/Delete implementációval)
- **Biztonsági mentések**: index-backup.html, index-before-patch-remove.html
"""
    content = content[:insertion_point] + new_section + content[insertion_point:]

# Update Phase 5 status
content = content.replace(
    '### 5. FÁZIS – Haladó funkciók (3-5 nap)\n- Drag & drop naptárban (FullCalendar)\n- Export/Import (JSON, CSV, Excel)\n- Fejlett szűrők és keresés\n- Email értesítések (Nodemailer)\n- Dark mode',
    '### 5. FÁZIS – Haladó funkciók (3-5 nap)\n- ✅ Task CRUD UI (lista, szűrés, CRUD) - 2025-10-01\n- ✅ Project Edit/Delete UI - 2025-10-01\n- [ ] Drag & drop naptárban (FullCalendar)\n- [ ] Export/Import (JSON, CSV, Excel)\n- [ ] Fejlett szűrők és keresés\n- [ ] Email értesítések (Nodemailer)\n- [ ] Dark mode'
)

# Write back
with open('project-summary.md', 'w', encoding='utf-8') as f:
    f.write(content)

print('project-summary.md updated successfully')
