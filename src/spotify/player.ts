import { getDevices, pickImage, spotifyFetch } from './api';
import { SpotifyError } from './errors';

export interface NowPlaying {
  isPlaying: boolean;
  trackName: string;
  artist: string;
  albumName: string;
  albumUri?: string;
  imageUrl?: string;
  progressMs: number;
  durationMs: number;
  deviceName?: string;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function isNoDevice(error: unknown): boolean {
  return error instanceof SpotifyError && error.kind === 'no-device';
}

// Sem dispositivo ativo, tenta acordar o primeiro disponível (ex.: Spotify aberto mas ocioso).
async function playWithFallback(body?: object): Promise<void> {
  const init: RequestInit = { method: 'PUT', headers: JSON_HEADERS, body: body ? JSON.stringify(body) : undefined };
  try {
    await spotifyFetch('/me/player/play', init);
  } catch (error) {
    if (!isNoDevice(error)) throw error;
    const device = (await getDevices()).find((d) => !d.isRestricted);
    if (!device) throw error;
    await spotifyFetch(`/me/player/play?device_id=${encodeURIComponent(device.id)}`, init);
  }
}

export function playAlbum(albumUri: string): Promise<void> {
  return playWithFallback({ context_uri: albumUri });
}

export function resume(): Promise<void> {
  return playWithFallback();
}

export async function pause(): Promise<void> {
  await spotifyFetch('/me/player/pause', { method: 'PUT' });
}

export async function next(): Promise<void> {
  await spotifyFetch('/me/player/next', { method: 'POST' });
}

export async function prev(): Promise<void> {
  await spotifyFetch('/me/player/previous', { method: 'POST' });
}

interface PlayerResponse {
  is_playing: boolean;
  progress_ms: number | null;
  device?: { name: string };
  item: {
    type: string;
    name: string;
    duration_ms: number;
    artists?: Array<{ name: string }>;
    album?: { name: string; uri: string; images: Array<{ url: string; width: number | null }> };
  } | null;
}

export async function getNowPlaying(): Promise<NowPlaying | null> {
  const res = await spotifyFetch('/me/player');
  if (res.status === 204) return null;
  const data = (await res.json()) as PlayerResponse;
  if (!data.item) return null;
  return {
    isPlaying: data.is_playing,
    trackName: data.item.name,
    artist: data.item.artists?.map((a) => a.name).join(', ') ?? '',
    albumName: data.item.album?.name ?? '',
    albumUri: data.item.album?.uri,
    imageUrl: pickImage(data.item.album?.images),
    progressMs: data.progress_ms ?? 0,
    durationMs: data.item.duration_ms,
    deviceName: data.device?.name,
  };
}
