# CONVENIO-BIOVETFARMA-1

PWA básico com login Firebase e placeholder pós-login.

## Publicação no GitHub Pages
Settings → Pages → Deploy from a branch → main → /(root)  
URL esperada: https://rmussi06-wq.github.io/CONVENIO-BIOVETFARMA-1/

## Ajustes
- `firebase-init.js`: já está com suas chaves do Firebase.
- `app.js`: já aponta para sua URL do Apps Script.
- `manifest.webmanifest`: inclui ícones (maskable).

## Backend Apps Script (CORS)
No `Code.gs`, permita a origem:
- https://rmussi06-wq.github.io
- https://rmussi06-wq.github.io/CONVENIO-BIOVETFARMA-1/
- http://localhost:8080
