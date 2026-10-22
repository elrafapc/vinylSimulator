import { useTheme } from '../theme/useTheme';
import { MoonIcon, SunIcon } from './MenuIcons';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro';
  return (
    <button type="button" className="icon-button" aria-label={label} title={label} onClick={toggle}>
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
