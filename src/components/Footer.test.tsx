import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Footer } from './Footer';

describe('Footer', () => {
  it('"Rafael Carneiro" abre o GitHub em nova aba, com segurança', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Developed by: Rafael Carneiro');
    const link = screen.getByRole('link', { name: 'Rafael Carneiro' });
    expect(link).toHaveAttribute('href', 'https://github.com/elrafapc');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
