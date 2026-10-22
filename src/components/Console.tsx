import { useEffect, useRef, type ReactNode } from 'react';
import { useDiscTracks } from '../hooks/useDiscTracks';
import { useLocalProgress } from '../hooks/useLocalProgress';
import { parseDiscUri, type Track } from '../spotify/api';
import type { NowPlaying } from '../spotify/player';
import { ARM_START, armAngle, discProgress } from './tonearm';
import './Console.css';
import { formatDuration, formatTime } from './lcd';
import { NextIcon, PauseIcon, PlayIcon, PrevIcon } from './PlayerIcons';
import { Turntable } from './Turntable';
import { VolumeKnob } from './VolumeKnob';

export interface ConsoleDisc {
  uri?: string;
  name?: string;
  artist?: string;
  imageUrl?: string;
}

interface ConsoleProps {
  nowPlaying: NowPlaying | null;
  /** Quando `nowPlaying` foi lido do Spotify (o tempo anda sozinho entre consultas). */
  fetchedAt: number;
  /** Disco no prato (o selecionado ou o que está tocando). */
  disc: ConsoleDisc;
  playing: boolean;
  disabled?: boolean;
  onNeedleClick: () => void;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  volume: number;
  volumeDisabled?: boolean;
  onVolumeChange: (value: number) => void;
  onVolumeCommit?: () => void;
  /** Clique numa faixa da lista: toca o disco a partir dela (T56). */
  onPlayTrack?: (track: Track) => void;
  /** Estrela de estante (★/☆), discreta no canto do texto. */
  shelfToggle?: ReactNode;
  /** Gaveta de discos da foto abre a estante. */
  onOpenDrawer?: () => void;
  /** Celular: a tela é só leitura (botões pequenos demais para o toque; o player fica no menu). */
  compact?: boolean;
}

const RECORD_URL = '/console/record.webp';

// Console (T55): vitrola + tela do player numa foto só; o código sobrepõe só o que muda.
export function Console({
  nowPlaying,
  fetchedAt,
  disc,
  playing,
  disabled,
  onNeedleClick,
  onPlayPause,
  onPrev,
  onNext,
  volume,
  volumeDisabled,
  onVolumeChange,
  onVolumeCommit,
  onPlayTrack,
  shelfToggle,
  onOpenDrawer,
  compact,
}: ConsoleProps) {
  const tracksState = useDiscTracks(disc.uri);
  const tracks = tracksState.status === 'ok' ? tracksState.tracks : undefined;
  // A tela mostra o Spotify só quando ele toca o disco do prato; senão, o disco escolhido, parado.
  const live =
    nowPlaying && (!disc.uri || nowPlaying.contextUri === disc.uri || nowPlaying.albumUri === disc.uri) ? nowPlaying : null;
  const progressMs = useLocalProgress(live, fetchedAt);
  const progress = live?.durationMs ? Math.min(100, (progressMs / live.durationMs) * 100) : 0;
  const angle = live ? armAngle(discProgress(tracks, live.trackId, progressMs, live.durationMs)) : ARM_START;
  const currentTrackId = live?.trackId;

  const listRef = useRef<HTMLOListElement>(null);
  // Mantém a faixa atual à vista na lista (rolagem só dentro da tela, não da página).
  useEffect(() => {
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!list || !row) return;
    list.scrollTop = row.offsetTop - list.clientHeight / 2 + row.offsetHeight / 2;
  }, [currentTrackId, tracks]);

  const title = live ? live.trackName || live.albumName : disc.name ?? 'Nenhum disco';
  const artist = live ? live.artist : disc.artist;
  const album = live
    ? live.albumYear
      ? `${live.albumName} (${live.albumYear})`
      : live.albumName
    : disc.name
      ? 'Baixe a agulha para tocar'
      : 'Escolha um disco na estante';

  return (
    <Turntable
      playing={playing}
      coverUrl={disc.imageUrl}
      albumName={disc.name}
      disabled={disabled}
      onNeedleClick={onNeedleClick}
      armAngle={angle}
    >
      <div className="console-screen" data-testid="console-screen">
        <span className="console-screen__window" aria-hidden>
          <span className="console-screen__vinyl" style={{ backgroundImage: `url(${RECORD_URL})` }} />
          {disc.imageUrl ? <img className="console-screen__cover" src={disc.imageUrl} alt="" /> : <span className="console-screen__cover" />}
        </span>

        <div className="console-screen__info" aria-live="polite">
          <p className="console-screen__track">{title}</p>
          {artist && <p className="console-screen__artist">{artist}</p>}
          <p className="console-screen__album">{album}</p>
        </div>
        {shelfToggle}

        <div
          className="console-screen__progress"
          role="progressbar"
          aria-label="Progresso da faixa"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <span className="console-screen__progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="console-screen__times" data-testid="console-time">
          <span>{live ? formatTime(progressMs) : '--:--'}</span>
          <span>{live ? formatTime(live.durationMs) : '--:--'}</span>
        </p>

        {!compact && (
          <>
            <button type="button" className="console-screen__button console-screen__button--prev" aria-label="Faixa anterior" disabled={disabled} onClick={onPrev}>
              <PrevIcon />
            </button>
            <button
              type="button"
              className="console-screen__button console-screen__button--main"
              aria-label={playing ? 'Pausar' : 'Tocar'}
              disabled={disabled}
              onClick={onPlayPause}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button type="button" className="console-screen__button console-screen__button--next" aria-label="Próxima faixa" disabled={disabled} onClick={onNext}>
              <NextIcon />
            </button>
          </>
        )}
        <VolumeKnob value={volume} disabled={volumeDisabled} onChange={onVolumeChange} onCommit={onVolumeCommit} />
        {nowPlaying?.deviceName && <p className="console-screen__device">Tocando em: {nowPlaying.deviceName}</p>}

        <div className="console-screen__list">
          {!parseDiscUri(disc.uri) && <p className="console-screen__note">{disc.uri ? 'Faixas indisponíveis.' : 'Sem disco no prato.'}</p>}
          {parseDiscUri(disc.uri) && tracksState.status === 'loading' && <p className="console-screen__note">Lendo a contracapa…</p>}
          {parseDiscUri(disc.uri) && tracksState.status === 'error' && <p className="console-screen__note">{tracksState.message}</p>}
          {tracks && (
            <ol ref={listRef} className="console-screen__tracks" aria-label="Faixas do disco">
              {tracks.map((track) => {
                const current = Boolean(currentTrackId) && track.id === currentTrackId;
                return (
                  <li
                    key={`${track.number}-${track.id}`}
                    className={current ? 'console-screen__row console-screen__row--current' : 'console-screen__row'}
                    aria-current={current ? 'true' : undefined}
                  >
                    <button
                      type="button"
                      className="console-screen__row-button"
                      aria-label={`Tocar faixa ${track.number}: ${track.name}`}
                      disabled={disabled || !onPlayTrack || !track.id}
                      onClick={() => onPlayTrack?.(track)}
                    >
                      <span className="console-screen__marker" aria-hidden>
                        {current ? '▶' : ''}
                      </span>
                      <span className="console-screen__num">{track.number}</span>
                      <span className="console-screen__name">{track.name}</span>
                      <span className="console-screen__time">{formatDuration(track.durationMs)}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      {onOpenDrawer && <button type="button" className="console__drawer" aria-label="Abrir estante" onClick={onOpenDrawer} />}
    </Turntable>
  );
}
