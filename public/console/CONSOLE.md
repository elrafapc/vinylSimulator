# Camadas do console — coordenadas

Base: console-base.webp — 1673×940, FUNDO TRANSPARENTE (só o console recortado, sem a mesa; tampa de acrílico semitransparente) (proporção 1673/940 ≈ 1.780). Todas as posições em % da base (left/top a partir do canto superior esquerdo).

| Elemento | px (na base) | % |
|---|---|---|
| Disco — centro | (460, 407) | left 27.50%, top 43.30% |
| Disco — tamanho na tela | 616 × 570 | largura 36.82% da base, altura 60.64% |
| Selo (capa do álbum) | 30% do diâmetro do disco, centralizado | — |
| Braço — pivô (eixo de rotação) | (885, 226) | left 52.90%, top 24.04% |
| Knob (volume / 33-45) — centro | (897, 595), Ø 76 | left 53.62%, top 63.30%, Ø 4.54% da largura |
| Tela — área útil (vidro) | x 1105–1598, y 132–730 | left 66.05%, top 14.04%, largura 29.47%, altura 63.62% |
| Gaveta de discos (aprox.) | x 115–1035, y 738–858 | left 6.87%, top 78.51%, largura 54.99%, altura 12.77% |

## Disco (record.webp)
- 795×795, fundo transparente, reflexos "assados" atenuados para não girarem junto.
- A foto não é 100% de cima: o disco aparece levemente achatado (altura = 0,925 × largura).
- Implementação: contêiner com largura 36.82% e proporção 1:1 → elemento interno gira (rotate) → contêiner aplica scaleY(0.925). Ordem: girar primeiro, achatar depois — senão o disco "bamboleia".
- Reflexo fixo opcional: camada sobre o disco, que NÃO gira (conic-gradient bem sutil).

## Braço (tonearm.webp)
- Fundo transparente, já em escala e alinhado com a base (gerado em 2x da base para nitidez). Headshell duplicado da imagem gerada foi removido.
- Posição do elemento: left 38.54%, top 14.97%, largura 19.07% da base (altura automática).
- transform-origin (pivô dentro da imagem): 75.95% 19.63%.
- Ângulos (rotate, positivo = horário), a partir da posição da imagem (0° = como no design):
  - repouso: -24° (sobre o apoio)
  - início do disco (borda externa): -6.75°
  - fim do disco (perto do selo): +16°
  - durante a música: interpolar entre -6.75° e +16° conforme o progresso do álbum
- Sombra: filter: drop-shadow(6px 8px 6px rgba(0,0,0,.45)) no braço.
- Ajuste fino visual permitido (±2°), sem mudar o pivô.


## Tela do player (já desenhada em console-base.webp)
A base agora contém a tela do design SEM conteúdo: painéis, moldura da capa (passe-partout vazio), corpo dos 3 botões (sem ícones), anel de LEDs e o ícone de volume. O código só sobrepõe o que é dinâmico. Nada de CSS para painéis, moldura ou botões.

| Elemento | px (base) | % da base |
|---|---|---|
| Janela da capa (dentro do passe-partout) | x 1140–1277, y 180–280 | left 68.14%, top 19.15%, largura 8.19%, altura 10.64% |
| Bloco de texto (faixa / artista / álbum) | x 1322–1590, y 152–222 | left 79.02%, top 16.17%, largura 16.02%, altura 7.45% |
| Barra de progresso (linha) | x 1324–1586, y 233–237 | left 79.14%, top 24.79%, largura 15.66%, altura 0.43% |
| Tempos (decorrido à esq., total à dir.) | x 1324–1586, y 243–257 | left 79.14%, top 25.85%, largura 15.66%, altura 1.49% |
| Botão anterior (área clicável) | centro (1356,302), r 22 | centro left 81.05%, top 32.13%; diâmetro 2.63% da largura |
| Botão play/pause (área clicável) | centro (1421,302), r 29 | centro left 84.94%, top 32.13%; diâmetro 3.47% da largura |
| Botão próxima (área clicável) | centro (1481,302), r 22 | centro left 88.52%, top 32.13%; diâmetro 2.63% da largura |
| Knob de volume — knob-cap.webp gira aqui | centro (1557,301), r 25 | centro left 93.07%, top 32.02%; diâmetro 2.99% da largura |
| Lista de faixas (área) | x 1110–1590, y 384–722 | left 66.35%, top 40.85%, largura 28.69%, altura 35.96% |

Detalhes:
- Capa: quadrada, encostada à esquerda da janela (altura total da janela); vinil (record.webp pequeno) saindo por trás à direita, cortado pela janela.
- Ícones dos botões: SVG simples em âmbar, centralizados (anterior/próxima ~40% do diâmetro do botão; play/pause ~45%). Estado pressionado: brightness(0.85), sem mudar o desenho.
- Knob: knob-cap.webp gira de -135° (0%) a +135° (100%); arrastar, scroll e setas; mesmo debounce do volume.
- Lista: 12 linhas visíveis (altura de linha = 2.13% da altura da base ≈ 28.4px); rolagem interna se houver mais; colunas: ▶ da faixa atual, número (alinhado à direita), título, duração (alinhada à direita); separador 1px rgba(255,255,255,0.12) (mais visível, como no design).
- Fontes: serifada para faixa e lista (ex.: Lora/Libre Baskerville, hospedada localmente); tempos em sans pequena.
- Tamanhos de fonte em unidades do contêiner (cqw) para escalar com o console: faixa ≈ 1.05cqw, artista ≈ 0.85cqw, álbum ≈ 0.62cqw, lista ≈ 0.80cqw, tempos ≈ 0.68cqw (cqw = 1% da largura do console).
- Cores (amostradas do design): faixa #EBDCC5 · artista #B2A591 · álbum #837A6C · tempos #A59B87 · lista #C8BCA8 · duração na lista #A99D8A (mais claras, como no design) · faixa atual e progresso (âmbar) #D89257 · fundo dos painéis #13100D.


## Fundo da página
- A base não tem mais a mesa de madeira atrás: o fundo da página aparece em volta do console. Usar um fundo liso e uniforme em toda a página (área principal e menu lateral iguais): escuro #14100D; claro #ECE6DC.
- Sombra do console: filter: drop-shadow(0 26px 30px rgba(0,0,0,.55)) no contêiner da base (no claro, .30).
- Nenhuma moldura, borda ou fundo próprio no contêiner do console.
