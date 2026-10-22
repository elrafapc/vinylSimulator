// Resumo do bloco Sons ambiente (T57), ex.: "Chiado ligado · chuva e lareira desligadas".
export interface SoundState {
  name: string;
  enabled: boolean;
  feminine?: boolean;
}

function joinNames(names: string[]): string {
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}` : names[0];
}

// Concordância: um som → gênero dele; vários → masculino se houver algum masculino.
function group(sounds: SoundState[], word: 'ligad' | 'desligad'): string {
  const feminine = sounds.every((s) => s.feminine);
  const ending = (feminine ? 'a' : 'o') + (sounds.length > 1 ? 's' : '');
  return `${joinNames(sounds.map((s) => s.name.toLowerCase()))} ${word}${ending}`;
}

export function soundsSummary(sounds: SoundState[]): string {
  const on = sounds.filter((s) => s.enabled);
  const off = sounds.filter((s) => !s.enabled);
  const text = [on.length ? group(on, 'ligad') : '', off.length ? group(off, 'desligad') : ''].filter(Boolean).join(' · ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
