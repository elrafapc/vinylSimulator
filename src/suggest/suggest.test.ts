import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { searchDiscs, type Disc } from '../spotify/api';
import { getSimilarArtists, getTopAlbums } from './lastfm';
import { suggestAlbum } from './suggest';

vi.mock('../spotify/api', () => ({ searchDiscs: vi.fn() }));

const kob: Disc = { id: 'a1', uri: 'spotify:album:a1', kind: 'album', name: 'Kind of Blue', artist: 'Miles Davis' };
const jazz: Disc = { id: 'p1', uri: 'spotify:playlist:p1', kind: 'playlist', name: 'Jazz', artist: 'Rafael' };
const blueTrain: Disc = { id: 'a2', uri: 'spotify:album:a2', kind: 'album', name: 'Blue Train', artist: 'John Coltrane' };

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe('lastfm', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('artistas parecidos, pelo proxy e sem chave no navegador', async () => {
    fetchMock.mockResolvedValue(json({ similarartists: { artist: [{ name: 'John Coltrane' }] } }));
    expect(await getSimilarArtists('Miles Davis')).toEqual(['John Coltrane']);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url.startsWith('/api/lastfm?')).toBe(true);
    expect(url).toContain('method=artist.getsimilar');
    expect(url).toContain('artist=Miles+Davis');
    expect(url).not.toContain('api_key');
  });

  it('top álbuns sem entradas "(null)"', async () => {
    fetchMock.mockResolvedValue(json({ topalbums: { album: [{ name: 'Blue Train' }, { name: '(null)' }] } }));
    expect(await getTopAlbums('John Coltrane')).toEqual(['Blue Train']);
  });

  it('erro do Last.fm vira mensagem clara', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockResolvedValue(json({ error: 6, message: 'Artist not found' }));
    await expect(getSimilarArtists('???')).rejects.toThrow('O Last.fm não respondeu. Tente de novo.');
  });

  it('servidor sem chave configurada avisa', async () => {
    fetchMock.mockResolvedValue(json({ error: 'missing-key' }, 500));
    await expect(getSimilarArtists('Miles Davis')).rejects.toThrow(/LASTFM_API_KEY/);
  });
});

describe('suggestAlbum', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn((url: string) =>
      Promise.resolve(
        url.includes('getsimilar')
          ? json({ similarartists: { artist: [{ name: 'John Coltrane' }] } })
          : json({ topalbums: { album: [{ name: 'Blue Train' }] } }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('sugere um álbum de artista parecido, com motivo', async () => {
    vi.mocked(searchDiscs).mockResolvedValue([blueTrain]);
    expect(await suggestAlbum([kob, jazz], new Set(), () => 0)).toEqual({
      disc: blueTrain,
      reason: 'Parecido com Miles Davis',
    });
    expect(searchDiscs).toHaveBeenCalledWith('album:Blue Train artist:John Coltrane');
  });

  it('não sugere o que já está na estante nem o que já foi sugerido', async () => {
    vi.mocked(searchDiscs).mockResolvedValue([blueTrain]);
    await expect(suggestAlbum([kob, blueTrain], new Set(), () => 0)).rejects.toThrow(/Não encontrei/);
    await expect(suggestAlbum([kob], new Set(['a2']), () => 0)).rejects.toThrow(/Não encontrei/);
  });

  it('estante só com playlists pede um álbum', async () => {
    await expect(suggestAlbum([jazz])).rejects.toThrow('Guarde pelo menos um álbum na estante para receber sugestões.');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
