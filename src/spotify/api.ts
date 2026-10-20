import { getAccessToken, refreshAccessToken } from './auth';
import { SpotifyError } from './errors';

const BASE_URL = 'https://api.spotify.com/v1';

export interface Album {
  id: string;
  uri: string;
  name: string;
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
  albums: {
    items: Array<{
      id: string;
      uri: string;
      name: string;
      artists: Array<{ name: string }>;
      images: SpotifyImage[];
    } | null>;
  };
}

export async function searchAlbums(query: string, limit = 10): Promise<Album[]> {
  const params = new URLSearchParams({ q: query, type: 'album', limit: String(limit) });
  const data = (await (await spotifyFetch(`/search?${params}`)).json()) as SearchResponse;
  return data.albums.items
    .filter((item) => item !== null)
    .map((item) => ({
      id: item.id,
      uri: item.uri,
      name: item.name,
      artist: item.artists.map((a) => a.name).join(', '),
      imageUrl: pickImage(item.images),
    }));
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
