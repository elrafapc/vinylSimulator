import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPlaylistDisc, type Disc } from '../spotify/api';
import type { NowPlaying } from '../spotify/player';
import { completeDisc, currentDisc } from './currentDisc';

vi.mock('../spotify/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../spotify/api')>();
  return { parseDiscUri: actual.parseDiscUri, getPlaylistDisc: vi.fn() };
});

const playing = (over: Partial<NowPlaying> = {}): NowPlaying => ({
  isPlaying: true,
  trackName: 'So What',
  artist: 'Miles Davis',
  albumName: 'Kind of Blue',
  albumUri: 'spotify:album:a1',
  contextUri: 'spotify:album:a1',
  imageUrl: 'img',
  progressMs: 0,
  durationMs: 1,
  ...over,
});

describe('currentDisc', () => {
  beforeEach(() => vi.clearAllMocks());

  it('álbum do contexto', () => {
    expect(currentDisc(playing())).toEqual({
      id: 'a1', uri: 'spotify:album:a1', kind: 'album', name: 'Kind of Blue', artist: 'Miles Davis', imageUrl: 'img',
    });
  });

  it('playlist do contexto (nome vem depois)', () => {
    expect(currentDisc(playing({ contextUri: 'spotify:playlist:p1' }))).toMatchObject({ id: 'p1', kind: 'playlist' });
  });

  it('sem contexto de disco (ex.: Curtidas), usa o álbum da faixa', () => {
    expect(currentDisc(playing({ contextUri: 'spotify:user:u1:collection' }))).toMatchObject({ id: 'a1', kind: 'album' });
    expect(currentDisc(playing({ contextUri: undefined }))).toMatchObject({ id: 'a1', kind: 'album' });
  });

  it('reaproveita o disco conhecido quando é o mesmo', () => {
    const jazz: Disc = { id: 'p1', uri: 'spotify:playlist:p1', kind: 'playlist', name: 'Jazz', artist: 'Rafael' };
    expect(currentDisc(playing({ contextUri: jazz.uri }), jazz)).toBe(jazz);
  });

  it('nada tocando: usa o disco selecionado', () => {
    const kob: Disc = { id: 'a1', uri: 'spotify:album:a1', kind: 'album', name: 'Kind of Blue', artist: 'Miles Davis' };
    expect(currentDisc(null, kob)).toBe(kob);
    expect(currentDisc(null)).toBeNull();
  });
});

describe('completeDisc', () => {
  it('busca os dados de playlist conhecida só pelo id', async () => {
    const full: Disc = { id: 'p1', uri: 'spotify:playlist:p1', kind: 'playlist', name: 'Jazz', artist: 'Ana' };
    vi.mocked(getPlaylistDisc).mockResolvedValue(full);
    expect(await completeDisc({ id: 'p1', uri: full.uri, kind: 'playlist', name: 'Playlist', artist: '' })).toBe(full);
  });

  it('se a busca falhar, guarda como está', async () => {
    vi.mocked(getPlaylistDisc).mockRejectedValue(new Error('403'));
    const partial: Disc = { id: 'p1', uri: 'spotify:playlist:p1', kind: 'playlist', name: 'Playlist', artist: '' };
    expect(await completeDisc(partial)).toBe(partial);
  });
});
