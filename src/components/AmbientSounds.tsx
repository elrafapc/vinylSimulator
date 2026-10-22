import { useState } from 'react';
import { createAmbient, loadAmbientPrefs, saveAmbientPrefs, type AmbientSound } from '../audio/ambient';
import { loadCracklePrefs } from '../audio/crackle';
import type { SoundPrefs } from '../audio/loop';
import { CrackleControl } from './CrackleControl';
import { ChevronIcon, WaveIcon } from './MenuIcons';
import { SoundControl } from './SoundControl';
import { soundsSummary } from './sounds';

const sound = (name: AmbientSound) => ({
  load: () => loadAmbientPrefs(name),
  save: (prefs: SoundPrefs) => saveAmbientPrefs(name, prefs),
  create: (volume: number) => createAmbient(name, volume),
});

// Fora do componente: mesmas funções a cada render, o motor de som não é recriado.
const RAIN = sound('rain');
const FIRE = sound('fire');

interface AmbientSoundsProps {
  playing: boolean;
}

// Bloco recolhível (T57): começa fechado, com o resumo do estado no cabeçalho.
// Fechado só esconde: os sons continuam montados e tocando.
// Agulha só com música tocando; chuva e lareira independem da música.
export function AmbientSounds({ playing }: AmbientSoundsProps) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(() => ({
    crackle: loadCracklePrefs().enabled,
    rain: RAIN.load().enabled,
    fire: FIRE.load().enabled,
  }));
  const summary = soundsSummary([
    { name: 'Chiado', enabled: enabled.crackle },
    { name: 'Chuva', enabled: enabled.rain, feminine: true },
    { name: 'Lareira', enabled: enabled.fire, feminine: true },
  ]);

  return (
    <section className="sounds">
      <h2 className="sounds__heading">
        <button
          type="button"
          className="sounds__toggle"
          aria-expanded={open}
          aria-controls="deck-sounds"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="sounds__icon">
            <WaveIcon />
          </span>
          <span className="sounds__text">
            <span className="sounds__title">Sons ambiente</span>
            <span className="sounds__summary">{summary}</span>
          </span>
          <ChevronIcon direction={open ? 'up' : 'down'} />
        </button>
      </h2>
      <div id="deck-sounds" className="sounds__body" hidden={!open}>
        <CrackleControl playing={playing} onEnabledChange={(on) => setEnabled((e) => ({ ...e, crackle: on }))} />
        <SoundControl active name="Chuva" volumeLabel="Volume da chuva" {...RAIN} onEnabledChange={(on) => setEnabled((e) => ({ ...e, rain: on }))} />
        <SoundControl active name="Lareira" volumeLabel="Volume da lareira" {...FIRE} onEnabledChange={(on) => setEnabled((e) => ({ ...e, fire: on }))} />
      </div>
    </section>
  );
}
