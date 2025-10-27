# Convênio Biovetfarma

Interface web para o portal do convênio dos profissionais Biovetfarma. Esta versão prepara toda a estrutura de autenticação e navegação; a integração com Apps Script e a planilha ainda será conectada nas próximas etapas.

## O que já está pronto

- Layout responsivo com cabeçalho, navegação por hash (`#/home`, `#/beneficios`, `#/documentos`) e rotas internas preparadas.
- Fluxo de autenticação com Firebase Auth (login, cadastro com modal, recuperação de senha e logout).
- Estrutura visual para destacar benefícios, documentos e um cartão de teste que chamará a rota de escrita na planilha.
- Service worker e manifesto PWA já referenciados, prontos para evolução.

## O que você precisa configurar

1. **Firebase** – Preencha `firebase-init.js` com as credenciais reais do projeto e habilite e-mail/senha no Firebase Auth.
2. **Apps Script** – Atualize a constante `APPS_SCRIPT_BASE` em `app.js` caso a URL de produção seja diferente e implemente as rotas esperadas (`register`, `testWrite`, etc.).
3. **Assets do convênio** – Substitua textos temporários, listas de benefícios e inclua documentos reais conforme necessidade.

## Como executar localmente

Basta servir os arquivos estáticos (ex.: `npx serve .`) e acessar pelo navegador. Para testar os fluxos autenticados será necessário fornecer uma configuração válida do Firebase.

## Próximos passos sugeridos

- Conectar o botão "Testar escrita" à rota real do Apps Script após validar o token Firebase.
- Preencher a rota `register` no Apps Script para armazenar novos profissionais na planilha e enviar notificações.
- Completar o service worker com pré-cache e política offline conforme os assets definitivos do projeto.
