import { createCrackle, loadCracklePrefs, saveCracklePrefs } from '../audio/crackle';
import { SoundControl } from './SoundControl';

interface CrackleControlProps {
  playing: boolean;
  onEnabledChange?: (enabled: boolean) => void;
}

export function CrackleControl({ playing, onEnabledChange }: CrackleControlProps) {
  return (
    <SoundControl
      active={playing}
      name="Chiado"
      volumeLabel="Volume do chiado"
      load={loadCracklePrefs}
      save={saveCracklePrefs}
      create={createCrackle}
      onEnabledChange={onEnabledChange}
    />
  );
}
