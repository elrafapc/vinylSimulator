# Vinyl Player Simulator

Toca-discos virtual na web que controla o Spotify (aberto em outro dispositivo) para ouvir um disco por vez, sem distrações. O áudio sai do app do Spotify; o navegador só mostra a vitrola e manda os comandos.

Requer **Spotify Premium** e o app do Spotify aberto em algum dispositivo (computador, celular, caixa de som).

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha as variáveis abaixo
npm run dev                  # http://127.0.0.1:5173
```

Abra pelo endereço **127.0.0.1**, não por `localhost`: o Spotify não aceita `localhost` como Redirect URI.

Antes de concluir qualquer mudança: `npm run validate` (lint + tipos + testes).

## Variáveis de ambiente

| Variável | Onde fica | Obrigatória | Para quê |
| --- | --- | --- | --- |
| `VITE_SPOTIFY_CLIENT_ID` | navegador | sim | Client ID do app no [Spotify Developer Dashboard](https://developer.spotify.com/dashboard). |
| `LASTFM_API_KEY` | só no servidor | não | Chave da [API do Last.fm](https://www.last.fm/api/account/create), usada só na "Sugestão de álbum". Sem ela, o resto funciona e a sugestão avisa que falta a chave. |

- Variáveis com prefixo `VITE_` vão para o JavaScript do navegador, ou seja, ficam **visíveis** para quem abrir o app. O Client ID do Spotify é público por natureza (login PKCE, sem segredo).
- A chave do Last.fm **não** tem o prefixo: o navegador chama `/api/lastfm` e quem fala com o Last.fm, com a chave, é o servidor — a função [`api/lastfm.ts`](api/lastfm.ts) na Vercel e um middleware equivalente no `npm run dev`/`npm run preview` (ver `vite.config.ts`). A função só aceita `artist.getSimilar` e `artist.getTopAlbums`.
- Quem usava `VITE_LASTFM_API_KEY` no `.env.local` precisa renomear para `LASTFM_API_KEY`.

## Configurar o app no Spotify

1. Crie um app no Spotify Developer Dashboard e copie o Client ID.
2. Em **Redirect URIs**, cadastre `<origem>/callback` para cada lugar onde o app vai rodar:
   - local: `http://127.0.0.1:5173/callback`
   - produção: `https://seu-dominio/callback`
3. Em **User Management**, adicione o e-mail de cada pessoa que vai usar (em Development Mode, só contas da lista conseguem entrar).

O app usa sempre `window.location.origin + "/callback"` como Redirect URI.

## Publicar (Vercel)

```bash
npm run build   # gera dist/
```

- Framework: Vite · Build: `npm run build` · Saída: `dist`
- Configure `VITE_SPOTIFY_CLIENT_ID` e, se quiser sugestões, `LASTFM_API_KEY` nas variáveis de ambiente do projeto (Settings → Environment Variables). A pasta `api/` vira Vercel Functions automaticamente.
- `vercel.json` manda qualquer rota (exceto `/api/*`) para `index.html`, para o `/callback` do login funcionar.
- Cadastre `https://seu-dominio/callback` no Spotify (ver acima).

## Estrutura

- `src/spotify/` — todo acesso ao Spotify (login, API, player)
- `src/components/` — interface (vitrola, busca, estante, controles…)
- `src/hooks/` — estado do player, volume, favoritos
- `src/audio/` — sons gerados no navegador (chiado, chuva, lareira)
- `src/suggest/` — sugestão de álbum via Last.fm (chama `/api/lastfm`)
- `api/` — Vercel Functions (`lastfm.ts`: proxy do Last.fm com a chave no servidor)
- `public/` — logos, ícones e manifest (PWA)

Decisões de projeto em [DECISIONS.md](DECISIONS.md); backlog em [TASKS.md](TASKS.md); marca em [BRAND.md](BRAND.md).
