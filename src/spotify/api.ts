import { cached, FOREVER, TEN_MINUTES } from './cache';
import { spotifyFetch } from './client';
import { SpotifyError } from './errors';

export type DiscKind = 'album' | 'playlist';

// Qualquer coisa que pode ir para o toca-discos: um álbum ou uma playlist.
export interface Disc {
  id: string;
  uri: string;
  kind: DiscKind;
  name: string;
  /** Artista do álbum ou dono da playlist. */
  artist: string;
  imageUrl?: string;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  isRestricted: boolean;
}

export interface User {
  id: string;
  displayName: string;
}

interface SpotifyImage {
  url: string;
  width: number | null;
}

// Todo acesso passa pelo cliente único (fila de 429, deduplicação, contador); ver client.ts.
export { spotifyFetch };

export function pickImage(images: SpotifyImage[] | undefined, minWidth = 300): string | undefined {
  if (!images?.length) return undefined;
  const sorted = [...images].sort((a, b) => (a.width ?? 0) - (b.width ?? 0));
  return (sorted.find((img) => (img.width ?? 0) >= minWidth) ?? sorted[sorted.length - 1]).url;
}

export async function getMe(): Promise<User> {
  const data = (await (await spotifyFetch('/me')).json()) as { id: string; display_name: string | null };
  return { id: data.id, displayName: data.display_name ?? data.id };
}

interface SearchResponse {
  albums?: {
    items: Array<{
      id: string;
      uri: string;
      name: string;
      artists: Array<{ name: string }>;
      images: SpotifyImage[];
    } | null>;
  };
  playlists?: {
    items: Array<{
      id: string;
      uri: string;
      name: string;
      owner: { display_name: string | null };
      images: SpotifyImage[] | null;
    } | null>;
  };
}

// Cache por termo (sessão): buscar e apagar não repete a chamada.
export function searchDiscs(query: string, limit = 10): Promise<Disc[]> {
  return cached(`search:${limit}:${query.trim().toLowerCase()}`, TEN_MINUTES, () => fetchSearch(query, limit));
}

async function fetchSearch(query: string, limit: number): Promise<Disc[]> {
  const params = new URLSearchParams({ q: query, type: 'album,playlist', limit: String(limit) });
  const data = (await (await spotifyFetch(`/search?${params}`)).json()) as SearchResponse;
  const albums: Disc[] = (data.albums?.items ?? [])
    .filter((item) => item !== null)
    .map((item) => ({
      id: item.id,
      uri: item.uri,
      kind: 'album',
      name: item.name,
      artist: item.artists.map((a) => a.name).join(', '),
      imageUrl: pickImage(item.images),
    }));
  const playlists: Disc[] = (data.playlists?.items ?? [])
    .filter((item) => item !== null)
    .map((item) => ({
      id: item.id,
      uri: item.uri,
      kind: 'playlist',
      name: item.name,
      artist: item.owner.display_name ?? '',
      imageUrl: pickImage(item.images ?? undefined),
    }));
  return [...albums, ...playlists];
}

interface PlaylistItem {
  id: string;
  uri: string;
  name: string;
  owner: { display_name: string | null };
  images: SpotifyImage[] | null;
}

interface PlaylistsResponse {
  items: Array<PlaylistItem | null>;
  next: string | null;
}

function playlistToDisc(item: PlaylistItem): Disc {
  return {
    id: item.id,
    uri: item.uri,
    kind: 'playlist',
    name: item.name,
    artist: item.owner.display_name ?? '',
    imageUrl: pickImage(item.images ?? undefined),
  };
}

const PLAYLISTS_PAGE = 50;
// Trava contra paginação sem fim (50 × 40 = 2000 playlists).
const MAX_PLAYLIST_PAGES = 40;

// Todas as minhas playlists, página por página (o importador filtra localmente).
export function getMyPlaylists(): Promise<Disc[]> {
  return cached('my-playlists', TEN_MINUTES, fetchMyPlaylists);
}

async function fetchMyPlaylists(): Promise<Disc[]> {
  const all: Disc[] = [];
  for (let page = 0; page < MAX_PLAYLIST_PAGES; page++) {
    const params = new URLSearchParams({ limit: String(PLAYLISTS_PAGE), offset: String(page * PLAYLISTS_PAGE) });
    const data = (await (await spotifyFetch(`/me/playlists?${params}`)).json()) as PlaylistsResponse;
    all.push(...data.items.filter((item) => item !== null).map(playlistToDisc));
    if (!data.next || data.items.length === 0) break;
  }
  return all;
}

// Nome, dono e capa de uma playlist (para guardar na estante uma playlist tocada direto pelo Spotify).
export function getPlaylistDisc(id: string): Promise<Disc> {
  return cached(`playlist:${id}`, TEN_MINUTES, () => fetchPlaylistDisc(id));
}

async function fetchPlaylistDisc(id: string): Promise<Disc> {
  const params = new URLSearchParams({ fields: 'id,uri,name,owner(display_name),images' });
  const res = await spotifyFetch(`/playlists/${encodeURIComponent(id)}?${params}`);
  return playlistToDisc((await res.json()) as PlaylistItem);
}

export interface Track {
  id: string;
  number: number;
  name: string;
  artist: string;
  durationMs: number;
}

interface TrackItem {
  id: string | null;
  name: string;
  duration_ms: number;
  artists?: Array<{ name: string }>;
}

function toTrack(item: TrackItem, number: number): Track {
  return {
    id: item.id ?? '',
    number,
    name: item.name,
    artist: item.artists?.map((a) => a.name).join(', ') ?? '',
    durationMs: item.duration_ms,
  };
}

// "spotify:album:ID" → { kind: 'album', id: 'ID' }; outros contextos (ex.: Curtidas) → null.
export function parseDiscUri(uri: string | undefined): { kind: DiscKind; id: string } | null {
  const [scheme, kind, id] = uri?.split(':') ?? [];
  if (scheme !== 'spotify' || !id || (kind !== 'album' && kind !== 'playlist')) return null;
  return { kind, id };
}

interface AlbumResponse {
  tracks: { items: Array<TrackItem & { track_number: number }> };
}

interface PlaylistItemsResponse {
  items: Array<{ item?: TrackItem | null; track?: TrackItem | null } | null>;
}

// Álbum via GET /albums/{id}; playlist via /items (só funciona para playlists minhas ou colaborativas).
// Álbuns não mudam: cache em memória + localStorage, sem expirar. Faixas de playlist: 10 min.
export function getDiscTracks(uri: string): Promise<Track[]> {
  const ref = parseDiscUri(uri);
  if (!ref) return Promise.reject(new SpotifyError('unknown', undefined, 'Faixas indisponíveis.'));
  if (ref.kind === 'album') return cached(`album:${ref.id}`, FOREVER, () => fetchAlbumTracks(ref.id), true);
  return cached(`playlist-items:${ref.id}`, TEN_MINUTES, () => fetchPlaylistTracks(ref.id));
}

async function fetchAlbumTracks(id: string): Promise<Track[]> {
  const data = (await (await spotifyFetch(`/albums/${encodeURIComponent(id)}`)).json()) as AlbumResponse;
  return data.tracks.items.map((item) => toTrack(item, item.track_number));
}

async function fetchPlaylistTracks(id: string): Promise<Track[]> {
  const params = new URLSearchParams({ limit: '50' });
  const res = await spotifyFetch(`/playlists/${encodeURIComponent(id)}/items?${params}`);
  const data = (await res.json()) as PlaylistItemsResponse;
  return data.items
    .map((entry) => entry?.item ?? entry?.track ?? null)
    .filter((item) => item !== null)
    .map((item, index) => toTrack(item, index + 1));
}

interface DevicesResponse {
  devices: Array<{ id: string | null; name: string; type: string; is_active: boolean; is_restricted: boolean }>;
}

export async function getDevices(): Promise<Device[]> {
  const data = (await (await spotifyFetch('/me/player/devices')).json()) as DevicesResponse;
  return data.devices
    .filter((d) => d.id !== null)
    .map((d) => ({
      id: d.id as string,
      name: d.name,
      type: d.type,
      isActive: d.is_active,
      isRestricted: d.is_restricted,
    }));
}
