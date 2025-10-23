# Convênio Biovetfarma — FINAL (sem cartão de teste backend)
## O que mudou
- Removido o cartão "Teste backend" da tela de login.
- Cadastro agora registra no backend (Sheets + e-mail admin) imediatamente após criar a conta.
- `sw.js` atualizado para `CACHE='bfarma-v6'` para forçar refresh.
## Como publicar
1) Suba todos os arquivos na raiz do repo `CONVENIO-BIOVETFARMA-1`.
2) No Apps Script, cole `Code.gs.txt` como `Code.gs`, defina as propriedades e reimplante.
3) Faça Hard Refresh no navegador (ou `Unregister` o SW em DevTools).
