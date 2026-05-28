# Cardápio Digital — Deploy no Netlify

## Estrutura do projeto

```
/
├── index.html            ← Página principal do cliente (montar marmita)
├── admin.html            ← Painel administrativo (protegido por senha)
├── login.html            ← Tela de login do admin
├── logout.html           ← Logout do admin
├── netlify.toml          ← Configuração do Netlify
├── netlify/
│   └── functions/
│       └── checkout.js   ← Serverless Function: gera QR Code Pix (Mercado Pago)
├── assets/
│   ├── css/client.css
│   └── img/
└── database.sql          ← Script SQL para criar as tabelas no Supabase
```

---

## Passo a passo para publicar

### 1. Configurar o Supabase

1. Acesse [supabase.com](https://supabase.com) e abra seu projeto.
2. Vá em **SQL Editor** e execute o conteúdo de `database.sql` para criar as tabelas.
3. As chaves já estão configuradas nos arquivos. Se precisar atualizar:
   - Abra `index.html` e `admin.html`
   - Procure por `SUPABASE_URL` e `SUPABASE_ANON_KEY`

### 2. Deploy no Netlify

**Opção A — Arrastar e soltar (mais rápido):**
1. Acesse [app.netlify.com](https://app.netlify.com)
2. Na aba **Sites**, arraste esta pasta inteira para a área de deploy.

**Opção B — Via Git:**
1. Suba esta pasta para um repositório GitHub/GitLab.
2. No Netlify, clique em **Add new site → Import an existing project**.
3. Conecte o repositório.
4. Em **Build settings**: deixe o campo *Build command* vazio e *Publish directory* como `.`

### 3. Configurar o token do Mercado Pago

Para que o PIX funcione em produção:

1. No Netlify, vá em **Site Settings → Environment Variables**.
2. Clique em **Add a variable**.
3. Nome: `MP_ACCESS_TOKEN`
4. Valor: seu token de produção do Mercado Pago (`APP_USR-...`)
5. Salve e faça um novo deploy (ou trigger no painel).

### 4. Alterar a senha do admin

Abra `login.html` e edite as linhas:
```js
const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_SENHA = 'admin123';  // ← troque aqui
```

---

## O que foi alterado em relação ao projeto original

| Arquivo | Situação | O que mudou |
|---|---|---|
| `index.html` | ✅ Corrigido | URL do Supabase errada; conflito de nome `supabase`; PIX conectado à Netlify Function |
| `admin.html` | ✅ Corrigido | URL errada; chave com 'S' extra; sintaxe de `createClient` inválida; proteção de login adicionada |
| `login.html` | 🔄 Reescrito | Era PHP puro — reescrito em HTML/JS puro |
| `logout.html` | 🔄 Reescrito | Era PHP puro — reescrito em HTML/JS puro |
| `montar.html` | ➡️ Redirecionado | Era PHP — redirecionado para `index.html` (mesma funcionalidade em Supabase) |
| `checkout.html` | 🔄 Virou Function | Era PHP (Mercado Pago) — substituído por `netlify/functions/checkout.js` |
| `config.html` | 🗑️ Removido | Configuração PHP do banco — não é mais necessário |
| `salvar_pedido.html` | 🗑️ Removido | PHP — o Supabase salva direto do JS |
| `netlify.toml` | 🆕 Criado | Configuração de build, redirects e headers |
