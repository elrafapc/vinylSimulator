import { getDevices, pickImage, spotifyFetch } from './api';
import { SpotifyError } from './errors';

export interface NowPlaying {
  isPlaying: boolean;
  trackId?: string;
  trackName: string;
  artist: string;
  albumName: string;
  albumUri?: string;
  /** Álbum ou playlist em reprodução (pode diferir do álbum da faixa). */
  contextUri?: string;
  imageUrl?: string;
  progressMs: number;
  durationMs: number;
  deviceName?: string;
  volumePercent?: number;
  /** false em dispositivos que não aceitam volume remoto (ex.: iPhone). */
  supportsVolume?: boolean;
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

// Dispositivo ativo ou, se nenhum estiver ativo, o primeiro disponível.
async function pickDevice(): Promise<string> {
  const devices = (await getDevices()).filter((d) => !d.isRestricted);
  const device = devices.find((d) => d.isActive) ?? devices[0];
  if (!device) throw new SpotifyError('no-device');
  return device.id;
}

function shuffleOff(deviceId: string): Promise<Response> {
  const params = new URLSearchParams({ state: 'false', device_id: deviceId });
  return spotifyFetch(`/me/player/shuffle?${params}`, { method: 'PUT' });
}

async function shuffleIsOn(): Promise<boolean> {
  const res = await spotifyFetch('/me/player');
  if (res.status === 204) return false;
  return ((await res.json()) as { shuffle_state?: boolean }).shuffle_state === true;
}

// Toca um álbum ou playlist da faixa 1, em ordem: o Spotify guarda o aleatório do último uso,
// então desliga antes e depois do play (o play pode reativar) e confere no fim.
export async function playDisc(contextUri: string): Promise<void> {
  const deviceId = await pickDevice();
  try {
    await shuffleOff(deviceId);
  } catch (error) {
    // Dispositivo ocioso pode recusar antes do play; o passo depois do play resolve.
    if (!isNoDevice(error)) throw error;
  }
  await spotifyFetch(`/me/player/play?${new URLSearchParams({ device_id: deviceId })}`, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify({ context_uri: contextUri, offset: { position: 0 }, position_ms: 0 }),
  });
  await shuffleOff(deviceId);
  if (await shuffleIsOn()) {
    console.warn('Spotify: aleatório continuou ligado depois do play; tentando desligar de novo.', { deviceId, contextUri });
    await shuffleOff(deviceId);
  }
}

export function resume(): Promise<void> {
  return playWithFallback();
}

export async function pause(): Promise<void> {
  await spotifyFetch('/me/player/pause', { method: 'PUT' });
}

export async function setVolume(percent: number): Promise<void> {
  const volume = Math.round(Math.min(100, Math.max(0, percent)));
  await spotifyFetch(`/me/player/volume?volume_percent=${volume}`, { method: 'PUT' });
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
  device?: { name: string; volume_percent: number | null; supports_volume?: boolean };
  context?: { uri: string } | null;
  item: {
    id?: string | null;
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
    trackId: data.item.id ?? undefined,
    trackName: data.item.name,
    artist: data.item.artists?.map((a) => a.name).join(', ') ?? '',
    albumName: data.item.album?.name ?? '',
    albumUri: data.item.album?.uri,
    contextUri: data.context?.uri,
    imageUrl: pickImage(data.item.album?.images),
    progressMs: data.progress_ms ?? 0,
    durationMs: data.item.duration_ms,
    deviceName: data.device?.name,
    volumePercent: data.device?.volume_percent ?? undefined,
    supportsVolume: data.device?.supports_volume ?? data.device?.volume_percent != null,
  };
}
