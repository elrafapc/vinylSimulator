# Escopo — Vinil Virtual (nome provisório)

## Problema
Ouvir música trabalhando sem distração (YouTube, notificações), com a experiência ritual do vinil e sem o custo de vitrola/discos. Usuário: Rafael (uso pessoal).

## MVP (precisa existir)
- [x] Login Spotify (OAuth PKCE, conta Premium)
- [x] Buscar e selecionar um álbum
- [x] Ação "baixar agulha" inicia o álbum no Spotify (Web API, dispositivo ativo)
- [x] Disco gira enquanto toca; agulha levanta/para no pause
- [x] Controles: play/pause, faixa anterior/próxima
- [x] Exibir faixa e artista atuais (sincronizados com o Spotify)

## Fora de escopo (agora)
- Áudio no navegador (Web Playback SDK)
- Outras plataformas além do Spotify
- Venda de discos digitais / multiusuário
- Animações avançadas, temas, responsivo mobile
- Hospedagem (roda em 127.0.0.1)

## Restrições
- Spotify Development Mode: Premium obrigatório, só allowlist
- Spotify desktop/mobile aberto em segundo plano tocando o áudio
- Sem backend no MVP (PKCE no cliente)
- Redirect URI em 127.0.0.1 (Spotify não aceita "localhost")
- Design próprio; referência só como inspiração

## Critério de pronto
- Selecionar álbum → baixar agulha → música toca no Spotify em < 3s e o disco gira
- Pause/next/prev no app refletem no Spotify e vice-versa (polling)

## Riscos e dúvidas abertas
- Endpoints de busca/biblioteca com limites em Dev Mode → validar na T03 (spike)
- Sem dispositivo ativo, o play falha → tratar com mensagem clara
- Visão futura (venda de discos) → decidir depois, em outro escopo
