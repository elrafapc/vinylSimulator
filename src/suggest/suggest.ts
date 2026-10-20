import { searchDiscs, type Disc } from '../spotify/api';
import { getSimilarArtists, getTopAlbums, SuggestError } from './lastfm';

export { SuggestError };

export interface Suggestion {
  disc: Disc;
  reason: string;
}

const MAX_TRIES = 4;
const ALBUMS_PER_ARTIST = 3;

const normalize = (name: string) => name.trim().toLowerCase();

function pick<T>(items: T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Parte de um álbum da estante → artista parecido (Last.fm) → álbum dele que ainda não está na estante (Spotify).
export async function suggestAlbum(shelf: Disc[], seen: Set<string> = new Set(), random = Math.random): Promise<Suggestion> {
  const albums = shelf.filter((d) => d.kind === 'album' && d.artist);
  if (albums.length === 0) {
    throw new SuggestError('Guarde pelo menos um álbum na estante para receber sugestões.');
  }
  const shelfIds = new Set(shelf.map((d) => d.id));
  const shelfArtists = new Set(albums.flatMap((d) => d.artist.split(', ')).map(normalize));

  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    const seedArtist = pick(albums, random).artist.split(', ')[0];
    const similar = await getSimilarArtists(seedArtist);
    // Prefere artistas que ainda não estão na estante.
    const fresh = similar.filter((name) => !shelfArtists.has(normalize(name)));
    const candidates = fresh.length ? fresh : similar;
    if (candidates.length === 0) continue;

    const artist = pick(candidates, random);
    const albumNames = shuffle(await getTopAlbums(artist), random).slice(0, ALBUMS_PER_ARTIST);
    for (const name of albumNames) {
      const found = await searchDiscs(`album:${name} artist:${artist}`);
      const disc = found.find((d) => d.kind === 'album' && !shelfIds.has(d.id) && !seen.has(d.id));
      if (disc) return { disc, reason: `Parecido com ${seedArtist}` };
    }
  }
  throw new SuggestError('Não encontrei uma sugestão agora. Tente de novo.');
}
