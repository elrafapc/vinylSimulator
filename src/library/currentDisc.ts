import { getPlaylistDisc, parseDiscUri, type Disc } from '../spotify/api';
import type { NowPlaying } from '../spotify/player';

// Disco do que está tocando: o contexto (álbum ou playlist) ou, sem ele, o álbum da faixa.
// `known` (ex.: o disco selecionado) completa o nome quando é a mesma playlist.
export function currentDisc(nowPlaying: NowPlaying | null, known?: Disc | null): Disc | null {
  if (!nowPlaying) return known ?? null;
  const fromContext = parseDiscUri(nowPlaying.contextUri);
  const ref = fromContext ?? parseDiscUri(nowPlaying.albumUri);
  if (!ref) return null;
  const uri = `spotify:${ref.kind}:${ref.id}`;
  if (known?.uri === uri) return known;
  if (ref.kind === 'album') {
    return { id: ref.id, uri, kind: 'album', name: nowPlaying.albumName, artist: nowPlaying.artist, imageUrl: nowPlaying.imageUrl };
  }
  // Playlist tocada direto pelo Spotify: o player não traz o nome; ele vem de completeDisc.
  return { id: ref.id, uri, kind: 'playlist', name: 'Playlist', artist: '' };
}

// Antes de guardar uma playlist que só conhecemos pelo id, busca nome, dono e capa.
export async function completeDisc(disc: Disc): Promise<Disc> {
  if (disc.kind !== 'playlist' || disc.artist) return disc;
  try {
    return await getPlaylistDisc(disc.id);
  } catch {
    return disc;
  }
}
