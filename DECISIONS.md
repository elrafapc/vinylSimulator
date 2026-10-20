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
