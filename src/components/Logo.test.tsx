import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo } from './Logo';

describe('Logo', () => {
  it('logo completo com as versões dos dois temas', () => {
    const { container } = render(<Logo />);
    expect(screen.getByRole('img', { name: 'Vinyl Player Simulator' })).toHaveClass('logo--full');
    const srcs = [...container.querySelectorAll('img')].map((img) => img.getAttribute('src'));
    expect(srcs).toEqual(['/brand/logo-dark-bg.png', '/brand/logo-light-bg.png']);
  });

  it('só o símbolo', () => {
    const { container } = render(<Logo variant="mark" />);
    const srcs = [...container.querySelectorAll('img')].map((img) => img.getAttribute('src'));
    expect(srcs).toEqual(['/brand/mark.png', '/brand/mark-light-bg.png']);
  });
});
