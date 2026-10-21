interface LogoProps {
  /** full = símbolo + nome; mark = só o símbolo (ex.: menu recolhido). */
  variant?: 'full' | 'mark';
}

const SOURCES = {
  full: { dark: '/brand/logo-dark-bg.png', light: '/brand/logo-light-bg.png' },
  mark: { dark: '/brand/mark.png', light: '/brand/mark-light-bg.png' },
};

// As duas versões vão para a página; o CSS mostra a do tema atual (sem piscar ao trocar).
export function Logo({ variant = 'full' }: LogoProps) {
  const { dark, light } = SOURCES[variant];
  return (
    <span className={`logo logo--${variant}`} role="img" aria-label="Vinyl Player Simulator">
      <img className="logo__img logo__img--dark" src={dark} alt="" />
      <img className="logo__img logo__img--light" src={light} alt="" />
    </span>
  );
}
