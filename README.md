# Convênio Biovetfarma

Portal PWA para colaboradores da Biovetfarma acompanharem o convênio de compras corporativas. A aplicação roda inteiramente em HTML, CSS e JavaScript puros, salva dados no `localStorage` e funciona offline graças ao service worker incluso.

## Funcionalidades

- **Home acolhedora** com boas-vindas personalizadas, visão geral de solicitações e chamada para entrar no convênio.
- **Compras** para envio do número de orçamento, descrição, valor estimado e observações ao administrador (demo sem integração externa).
- **Histórico** com filtros de status e busca textual, listando todas as solicitações registradas no dispositivo.
- **Sair** para encerrar a sessão mantendo os dados salvos localmente.
- **PWA pronto**: manifesto com ícones oficiais da Biovetfarma, service worker com pré-cache e suporte offline.

## Como usar

1. Abra o `index.html` em um navegador moderno (ou sirva a pasta com qualquer servidor estático, ex.: `npx serve .`).
2. Identifique-se com nome e e-mail corporativo para destravar as abas de Compras e Histórico.
3. Envie novos orçamentos preenchendo o formulário. As informações ficam salvas apenas no `localStorage` do navegador.
4. Consulte o Histórico para acompanhar o status e valores aproximados.
5. Utilize a aba **Sair** para encerrar a sessão quando desejar (os dados permanecerão no dispositivo).

## Personalização

- As cores seguem a paleta Pantone fornecida (verde e azul Biovetfarma). Ajuste os valores no `:root` de `styles.css` para variações.
- O logotipo e os ícones do PWA estão em `assets/brand/` e `assets/icons/`. Substitua pelos arquivos definitivos conforme necessário.
- Para resetar o ambiente de demonstração, limpe o `localStorage` do navegador (chave `biovet-convenio-demo`).

## Estrutura dos dados (localStorage)

```json
{
  "session": {
    "name": "Colaborador",
    "email": "nome@biovetfarma.com.br",
    "department": "Setor",
    "joinedAt": "2024-05-23T18:25:43.511Z"
  },
  "compras": {
    "nome@biovetfarma.com.br": [
      {
        "id": "uuid",
        "numero": "BVF-2024-001",
        "descricao": "Descrição",
        "fornecedor": "Farmácia",
        "observacoes": "Observações",
        "valor": 1234.56,
        "status": "pendente",
        "createdAt": "2024-05-23T18:30:00.000Z"
      }
    ]
  }
}
```

Como se trata de uma simulação, nenhum dado é enviado à internet. Ajuste o código para integrar com serviços reais quando estiver pronto.
