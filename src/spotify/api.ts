import { getAccessToken, refreshAccessToken } from './auth';
import { SpotifyError } from './errors';

const BASE_URL = 'https://api.spotify.com/v1';

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

interface ApiErrorBody {
  error?: { status?: number; message?: string; reason?: string };
}

async function toSpotifyError(path: string, res: Response): Promise<SpotifyError> {
  let reason: string | undefined;
  try {
    reason = ((await res.json()) as ApiErrorBody).error?.reason;
  } catch {
    // corpo vazio ou não-JSON
  }
  if (reason === 'NO_ACTIVE_DEVICE') return new SpotifyError('no-device', res.status);
  if (res.status === 404 && path.startsWith('/me/player')) return new SpotifyError('no-device', 404);
  if (reason === 'PREMIUM_REQUIRED') return new SpotifyError('premium', res.status);
  if (res.status === 401) return new SpotifyError('auth', 401);
  if (res.status === 429) return new SpotifyError('rate-limit', 429);
  return new SpotifyError('unknown', res.status, `Erro do Spotify (${res.status}).`);
}

export async function spotifyFetch(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const token = await getAccessToken();
  if (!token) throw new SpotifyError('auth');
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new SpotifyError('network');
  }
  if (res.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) throw new SpotifyError('auth', 401);
    return spotifyFetch(path, init, false);
  }
  if (!res.ok) throw await toSpotifyError(path, res);
  return res;
}

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

export async function searchDiscs(query: string, limit = 10): Promise<Disc[]> {
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

interface PlaylistsResponse {
  items: Array<{
    id: string;
    uri: string;
    name: string;
    owner: { display_name: string | null };
    images: SpotifyImage[] | null;
  } | null>;
}

export async function getMyPlaylists(limit = 50): Promise<Disc[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  const data = (await (await spotifyFetch(`/me/playlists?${params}`)).json()) as PlaylistsResponse;
  return data.items
    .filter((item) => item !== null)
    .map((item) => ({
      id: item.id,
      uri: item.uri,
      kind: 'playlist',
      name: item.name,
      artist: item.owner.display_name ?? '',
      imageUrl: pickImage(item.images ?? undefined),
    }));
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
export async function getDiscTracks(uri: string): Promise<Track[]> {
  const ref = parseDiscUri(uri);
  if (!ref) throw new SpotifyError('unknown', undefined, 'Faixas indisponíveis.');
  if (ref.kind === 'album') {
    const data = (await (await spotifyFetch(`/albums/${encodeURIComponent(ref.id)}`)).json()) as AlbumResponse;
    return data.tracks.items.map((item) => toTrack(item, item.track_number));
  }
  const params = new URLSearchParams({ limit: '50' });
  const res = await spotifyFetch(`/playlists/${encodeURIComponent(ref.id)}/items?${params}`);
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
