# Gestão de Avicultura

Uma aplicação web completa para gerenciar fazendas de aves, desenvolvida com React, Vite, TailwindCSS e suporte PWA.

## 🚀 Características

- **Gestão de Grupos**: Crie e gerencie grupos de aves com informações detalhadas
- **QR Code**: Gere QR Codes para cada grupo para rastreamento rápido
- **Produção**: Registre a produção diária com qualidade e peso
- **Incubação**: Acompanhe lotes de incubação com temperatura e umidade
- **Mortalidade**: Registre óbitos com causa e observações
- **Alimentação**: Controle o uso de ração e custos
- **Vendas**: Registre vendas com preços e formas de pagamento
- **PWA**: Funciona offline com sincronização quando online
- **Responsivo**: Funciona em desktop, tablet e mobile
- **Autenticação**: Sistema de login seguro

## 📋 Tecnologias

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS 4
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Routing**: Wouter
- **Icons**: Heroicons
- **QR Code**: qrcode.react
- **PWA**: vite-plugin-pwa

## 📁 Estrutura do Projeto

```
src/
├── api/                    # Clientes de API
│   ├── auth.ts
│   ├── groups.ts
│   ├── production.ts
│   ├── incubation.ts
│   ├── mortality.ts
│   ├── feed.ts
│   ├── sales.ts
│   └── supabaseClient.ts
├── components/             # Componentes reutilizáveis
│   ├── layout/
│   │   ├── AppContainer.tsx
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       ├── Loading.tsx
│       ├── EmptyState.tsx
│       ├── QRCodeViewer.tsx
│       └── Toast.tsx
├── hooks/                  # Custom hooks
│   ├── useAuth.ts
│   ├── useGroups.ts
│   ├── useProduction.ts
│   ├── useIncubation.ts
│   ├── useMortality.ts
│   ├── useFeed.ts
│   ├── useSales.ts
│   └── useAppStore.ts
├── pages/                  # Páginas da aplicação
│   ├── Auth/
│   ├── Home/
│   ├── Groups/
│   ├── Production/
│   ├── Incubation/
│   ├── Mortality/
│   ├── Feed/
│   ├── Sales/
│   └── Profile/
├── router/                 # Roteamento
│   └── AppRoutes.tsx
├── utils/                  # Utilitários
│   ├── date.ts
│   └── format.ts
├── styles/                 # Estilos globais
│   └── global.css
└── App.tsx                 # Componente raiz
```

## 🛠️ Instalação

1. **Clonar o repositório**
```bash
git clone <repository-url>
cd avicultura-app
```

2. **Instalar dependências**
```bash
pnpm install
```

3. **Configurar variáveis de ambiente**
```bash
cp .env.example .env.local
```

4. **Iniciar servidor de desenvolvimento**
```bash
pnpm dev
```

A aplicação estará disponível em `http://localhost:3000`

## 📦 Scripts Disponíveis

- `pnpm dev` - Inicia o servidor de desenvolvimento
- `pnpm build` - Cria a build de produção
- `pnpm preview` - Visualiza a build de produção
- `pnpm check` - Verifica tipos TypeScript
- `pnpm format` - Formata o código com Prettier

## 🔐 Autenticação

A aplicação utiliza um sistema de autenticação baseado em tokens JWT. O cliente Supabase está configurado para:

- Fazer login com email e senha
- Armazenar token no localStorage
- Renovar token automaticamente
- Fazer logout e limpar dados

## 📱 PWA (Progressive Web App)

A aplicação é uma PWA completa com:

- **Offline First**: Funciona offline com sincronização quando online
- **Installable**: Pode ser instalada como app nativo
- **Responsive**: Adapta-se a qualquer tamanho de tela
- **Service Worker**: Gerencia cache e sincronização

Para instalar:
1. Abra a aplicação no navegador
2. Clique no ícone de instalação (ou menu > Instalar)
3. Acesse a aplicação como um app nativo

## 🎨 Personalização

### Cores
Edite `client/src/index.css` para alterar o esquema de cores:

```css
:root {
  --primary: oklch(0.56 0.2 259.8);
  --primary-foreground: oklch(0.98 0.001 286);
  /* ... mais cores ... */
}
```

### Fontes
Edite `client/index.html` para adicionar novas fontes do Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet" />
```

## 🚀 Deploy

### Vercel
```bash
vercel deploy
```

### Netlify
```bash
netlify deploy --prod --dir=dist/public
```

### Docker
```bash
docker build -t avicultura-app .
docker run -p 3000:3000 avicultura-app
```

## 📝 Licença

MIT

## 👨‍💻 Autor

Desenvolvido com ❤️ para gerenciamento de avicultura.

## 📞 Suporte

Para suporte, abra uma issue no repositório ou entre em contato através do email.

---

**Versão**: 1.0.0  
**Última atualização**: 2024
