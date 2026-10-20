export type SpotifyErrorKind = 'no-device' | 'auth' | 'network' | 'premium' | 'rate-limit' | 'unknown';

export const MESSAGES: Record<SpotifyErrorKind, string> = {
  'no-device': 'Abra o Spotify em algum dispositivo',
  auth: 'Sessão expirada. Entre novamente.',
  network: 'Falha de rede. Verifique sua conexão.',
  premium: 'É preciso ter Spotify Premium para controlar a reprodução.',
  'rate-limit': 'Muitas requisições ao Spotify. Aguarde alguns segundos.',
  unknown: 'Algo deu errado ao falar com o Spotify.',
};

export class SpotifyError extends Error {
  readonly kind: SpotifyErrorKind;
  readonly status?: number;

  constructor(kind: SpotifyErrorKind, status?: number, message = MESSAGES[kind]) {
    super(message);
    this.name = 'SpotifyError';
    this.kind = kind;
    this.status = status;
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof SpotifyError) return error.message;
  return MESSAGES.unknown;
}
