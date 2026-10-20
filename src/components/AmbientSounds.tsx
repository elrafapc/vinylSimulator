import { createAmbient, loadAmbientPrefs, saveAmbientPrefs, type AmbientSound } from '../audio/ambient';
import type { SoundPrefs } from '../audio/loop';
import { CrackleControl } from './CrackleControl';
import { SoundControl } from './SoundControl';

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

// Agulha só com música tocando; chuva e lareira independem da música.
export function AmbientSounds({ playing }: AmbientSoundsProps) {
  return (
    <div className="sounds">
      <CrackleControl playing={playing} />
      <SoundControl active labelOn="Chuva ligada" labelOff="Chuva desligada" volumeLabel="Volume da chuva" {...RAIN} />
      <SoundControl active labelOn="Lareira ligada" labelOff="Lareira desligada" volumeLabel="Volume da lareira" {...FIRE} />
    </div>
  );
}
