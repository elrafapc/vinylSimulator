import { useTheme } from '../theme/useTheme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro';
  return (
    <button type="button" className="theme-toggle" aria-label={label} title={label} onClick={toggle}>
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
