# Menu lateral — especificação (T57)

Referência visual: docs/design/menu-escuro.png, docs/design/menu-claro.png, docs/design/menu-componentes.png

## Estrutura (largura 400px, de cima para baixo)
1. Cabeçalho (padding 20px 24px, linha inferior 1px): [recolher menu 36px] [avatar 32px com iniciais + nome, ocupa o espaço] [tela cheia 36px] [tema 36px] [Sair, botão texto 36px]
2. Conteúdo (padding 24px, 28px entre seções, linha 1px entre seções):
   - **Estante**: título + contador "14 discos" + setas ‹ › (32px, redondas) à direita; chips de etiqueta (Todas, …, "Sem etiqueta" tracejado); carrossel de capas 76px (gap 10px, cantos 4px, sombra; disco atual com anel âmbar 2px afastado 2px); degradê no fim do carrossel sumindo no fundo; botão secundário largo "Abrir estante inteira".
   - **Buscar discos**: título + campo 44px com ícone de lupa; resultados em lista (capa 40px, nome, "artista · álbum/playlist"), linha 1px entre itens, hover = superfície 2.
   - **Importar do Spotify**: título + texto de apoio "Traga suas playlists para a estante." + botão PRIMÁRIO largo "Importar playlists" (único botão âmbar do menu).
   - **Sons ambiente**: bloco recolhível 52px (ícone de onda âmbar, título, resumo "Chiado ligado · chuva e lareira desligadas", seta). Aberto: uma linha por som = nome (96px) + interruptor 40×24 + controle de volume; desligado = nome e volume esmaecidos, volume preservado. Começa fechado.
3. Sem textura de madeira, sem plaquinhas, sem papel, sem puxadores. Fundo do menu = fundo da página; separação do console só por 1px de borda à esquerda.

## Cores
| Token | Escuro | Claro |
|---|---|---|
| fundo (página e menu) | #14100D | #ECE6DC |
| superfície | #1C1713 | #F6F1E9 |
| superfície 2 (hover) | #231C17 | #EFE8DD |
| borda | #2C241E | #D6CBBE |
| borda forte (hover) | #3A3028 | #BFB2A3 |
| linha divisória | #2A221C | #D6CBBE |
| texto | #EBDCC5 | #2A211B |
| texto 2 | #B2A591 | #5E5145 |
| texto 3 (apoio, contadores) | #8A7F70 | #6B5D50 |
| âmbar (preenchimento) | #D89257 | #C97B3D |
| âmbar (texto/borda ativa) | #E8A872 | #8A4A1F |
| texto sobre âmbar | #1A120C | #1A120C |
| chip ativo (fundo) | rgba(216,146,87,.14) | rgba(201,123,61,.16) |

## Tipografia
- Títulos de seção: Lora 600 20px · título do bloco Sons: Lora 600 15px
- Botões e campos: Inter 500 14px (primário 600) · apoio: Inter 400 13px · chips/contadores: Inter 500 12px
- Fontes hospedadas localmente (public/fonts), sem CDN.

## Medidas
- Grade de 8px · margem interna do menu 24px · 28px entre seções · 12–14px entre título e conteúdo
- Controles 44px de altura (ícones do cabeçalho 36px, setas 32px, chips 30px) · cantos 8px (chips 999px, capas 4px)

## Estados
- Hover: secundário/chip → superfície 2 + borda forte; primário → #E8A872 (escuro) / #B86C32 (claro)
- Foco (teclado): anel 2px na cor do fundo + 2px âmbar (box-shadow), nunca remover outline sem substituto
- Campo em foco: borda âmbar + halo 3px rgba(216,146,87,.20); ícone da lupa em âmbar
- Ativo (chip, disco atual): âmbar conforme tabela
- Contraste AA em todos os textos (já validado nas cores acima)
