import { createCrackle, loadCracklePrefs, saveCracklePrefs } from '../audio/crackle';
import { SoundControl } from './SoundControl';

interface CrackleControlProps {
  playing: boolean;
}

export function CrackleControl({ playing }: CrackleControlProps) {
  return (
    <SoundControl
      active={playing}
      labelOn="Chiado ligado"
      labelOff="Chiado desligado"
      volumeLabel="Volume do chiado"
      load={loadCracklePrefs}
      save={saveCracklePrefs}
      create={createCrackle}
    />
  );
}
