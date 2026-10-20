# Decisões — Vinil Virtual

## ADR-001 — Controlar o Spotify em vez de tocar no navegador

- Data: 2026-10-15
- Contexto: Web Playback SDK com relatos de falha em Development Mode após as mudanças de 2026.
- Decisão: o app controla o Spotify (desktop/celular) via Web API; o áudio sai do app do Spotify.
- Alternativas: Web Playback SDK — descartado por risco e complexidade.
- Consequência: Spotify precisa estar aberto em algum dispositivo.

## ADR-002 — Sem backend, OAuth PKCE no navegador

- Data: 2026-10-15
- Contexto: uso pessoal, rodando local.
- Decisão: PKCE no cliente; redirect http://127.0.0.1:5173/callback.
- Alternativas: backend com client secret — desnecessário agora.
- Consequência: backend só quando houver contas/venda de discos.

## ADR-003 — Stack Vite + React + TypeScript + Vitest

- Data: 2026-10-15
- Contexto: UI com estado de player e animação simples.
- Decisão: Vite + React + TS; animação em CSS; Vitest para testes.
- Alternativas: JS puro — mais simples no início, pior para manter estado.
- Consequência: uma etapa de build, ferramentas padrão de mercado.

## ADR-004 — Acesso ao Spotify isolado em src/spotify/

- Data: 2026-10-15
- Contexto: no futuro, outras fontes de discos.
- Decisão: a UI só chama funções de src/spotify/ (playAlbum, pause, getNowPlaying...).
- Alternativas: interface genérica de "fonte de música" — abstração antecipada.
- Consequência: nova fonte entra ao lado, sem reescrever a UI.

## ADR-005 — Busca limitada a 10 resultados

- Data: 2026-10-20
- Contexto: em Development Mode o Spotify limita `/search` a no máximo 10 itens por página.
- Decisão: `searchAlbums` usa `limit=10`, sem paginação.
- Alternativas: paginar com `offset` — desnecessário para escolher um disco.
- Consequência: buscas genéricas exigem termos mais específicos.

## ADR-006 — Sem dispositivo ativo, acordar o primeiro disponível

- Data: 2026-10-20
- Contexto: com o Spotify aberto mas ocioso, `/me/player/play` retorna 404 NO_ACTIVE_DEVICE.
- Decisão: `playAlbum`/`resume` tentam de novo com `device_id` do primeiro dispositivo não restrito; sem nenhum, mostram "Abra o Spotify em algum dispositivo".
- Alternativas: sempre exibir erro — pior experiência no caso mais comum.
- Consequência: pode tocar num dispositivo inesperado se houver vários abertos.

## ADR-007 — Trocar de disco levanta a agulha

- Data: 2026-10-20
- Contexto: selecionar outro álbum enquanto um toca.
- Decisão: selecionar um álbum diferente pausa a reprodução; tocar o novo exige baixar a agulha.
- Alternativas: tocar imediatamente ao selecionar — perde o ritual do vinil.
- Consequência: um clique a mais, intencional.

## ADR-008 — Testes rodam com `--no-experimental-webstorage`

- Data: 2026-10-20
- Contexto: Node 22+ expõe um `localStorage` nativo que sobrepõe o do jsdom e quebra os testes.
- Decisão: `vite.config.ts` passa a flag aos workers do Vitest.
- Consequência: nenhuma no app; só afeta o ambiente de testes.

## ADR-009 — "Disco" = álbum ou playlist; comparação pelo contexto

- Data: 2026-10-20
- Contexto: T12 permite tocar playlists; o álbum da faixa atual não identifica a playlist.
- Decisão: tipo `Disc` (`kind: 'album' | 'playlist'`), `searchDiscs` e `playDisc(contextUri)`; o app compara o disco selecionado com `contextUri` do `/me/player`.
- Alternativas: tipos separados para álbum e playlist — duplicaria a UI.
- Consequência: substitui `searchAlbums`/`playAlbum` citados na ADR-004.

## ADR-010 — Chiado gerado na hora, ligado por padrão

- Data: 2026-10-20
- Contexto: T11 pede ruído de agulha sem arquivo de áudio.
- Decisão: buffer de 6s gerado com Web Audio (chiado filtrado + estalos aleatórios) em loop; começa ligado com volume 35%.
- Consequência: navegadores podem exigir um clique na página antes do primeiro som.

## ADR-011 — Escopos de playlist no login

- Data: 2026-10-20
- Contexto: T15 importa playlists do usuário (`/me/playlists`).
- Decisão: adicionar `playlist-read-private` e `playlist-read-collaborative` aos escopos.
- Consequência: quem entrou antes precisa sair e entrar de novo; o app pede isso ao receber 403.

## ADR-012 — Sugestão de álbum via Last.fm

- Data: 2026-10-20
- Contexto: Spotify removeu endpoints de recomendação e artistas relacionados.
- Decisão: Last.fm (artist.getSimilar + artist.getTopAlbums); Spotify só para achar e tocar o álbum.
- Alternativas: Claude API — sugestão melhor, mas custo por clique e chave a proteger.
- Consequência: motivo da sugestão é simples ("Parecido com X"); módulo src/suggest/ isolado permite trocar por LLM depois.

## ADR-013 — Sons ambiente gerados, chuva e lareira desligadas por padrão

- Data: 2026-10-20
- Contexto: T21 adiciona chuva e lareira ao chiado da agulha.
- Decisão: mesmo motor do chiado (`src/audio/loop.ts`), buffers de 8s gerados na hora com emenda suave no loop; chuva e lareira começam desligadas e tocam independente da música.
- Alternativas: arquivos de áudio gravados — mais realistas, mas pesam no repositório.
- Consequência: som sintético; se o navegador bloquear o áudio, ele retoma no próximo clique ou tecla.

## ADR-014 — Layout com palco + menu lateral recolhível

- Data: 2026-10-20
- Contexto: T18 pede o toca-discos como foco da tela.
- Decisão: grid 70/30; toca-discos medido em % de uma base 460×380 (escala com a largura, limitado pela altura da tela); estante vira painel modal (T19); estado do menu em `localStorage` (`vinil.sidebar`).
- Consequência: em telas largas e baixas, o limite de altura faz o toca-discos crescer pouco ao recolher o menu.

## ADR-015 — Faixas do disco: álbum por ID, playlist só se for minha

- Data: 2026-10-20
- Contexto: T20 mostra as faixas do disco no toca-discos.
- Decisão: `GET /albums/{id}` para álbuns; `GET /playlists/{id}/items` (até 50 faixas) para playlists; qualquer erro em playlist vira "Faixas indisponíveis." e mostra só a capa. Faixa atual destacada pelo `id` vindo de `/me/player`.
- Consequência: playlists de outras pessoas e contextos como "Músicas curtidas" não listam faixas.

## ADR-016 — PWA sem service worker

- Data: 2026-10-20
- Contexto: T24 pede instalar o app em janela própria.
- Decisão: só `manifest.webmanifest` (display "standalone") + ícones PNG 192/512 em `public/`; sem service worker, já que o Chrome/Edge atuais não exigem um para instalar e o app não funciona offline (depende do Spotify).
- Alternativas: service worker com cache (ex.: vite-plugin-pwa) — nova dependência e risco de servir versão velha.
- Consequência: o app instalado precisa do `npm run dev` rodando em 127.0.0.1:5173; o login abre o Spotify dentro da janela do app e volta para /callback.

## ADR-017 — Giro do prato com requestAnimationFrame (exceção ao "CSS puro")

- Data: 2026-10-20
- Contexto: T25 pede que o prato acelere (~1s) e desacelere (~1,5s) a partir do ângulo atual. Com animação CSS, ao retomar depois de uma pausa a capa "pula" de ângulo.
- Decisão: um loop `requestAnimationFrame` dentro do `Turntable` controla a velocidade (até 33⅓ rpm) e escreve `rotate()` direto no estilo do disco, sem re-render do React. Começa só depois do braço chegar e a agulha descer (1,2s). Com `prefers-reduced-motion`, não gira. O resto (braço, agulha, LED) continua em CSS; braço desenhado em SVG inline.
- Alternativas: só CSS — mais simples, mas com salto visível da capa.
- Consequência: única animação em JS do app; sem biblioteca.
