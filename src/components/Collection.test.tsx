import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ShelfDisc } from '../library/favorites';
import { Collection } from './Collection';

const kob: ShelfDisc = { id: 'a1', uri: 'spotify:album:a1', kind: 'album', name: 'Kind of Blue', artist: 'Miles Davis', imageUrl: 'https://img/kob.jpg', tags: ['Jazz', 'Para trabalhar'], addedAt: 100 };
const nevermind: ShelfDisc = { id: 'a2', uri: 'spotify:album:a2', kind: 'album', name: 'Nevermind', artist: 'Nirvana', tags: ['Rock'], addedAt: 300 };
const cafe: ShelfDisc = { id: 'a3', uri: 'spotify:album:a3', kind: 'album', name: 'Café', artist: 'Ângela', tags: [] };

type Props = Partial<Parameters<typeof Collection>[0]>;

function setup(props: Props = {}) {
  const handlers = { onOpen: vi.fn(), onPlay: vi.fn(), onClose: vi.fn(), onDrop: vi.fn() };
  render(<Collection discs={[kob, nevermind, cafe]} {...handlers} {...props} />);
  return handlers;
}

const sortSelect = () => screen.getByRole('combobox', { name: 'Organizar por' });
const titles = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
const gridNames = () =>
  within(screen.getByRole('list', { name: 'Discos da coleção' }))
    .getAllByRole('button', { name: /^Abrir / })
    .map((b) => b.getAttribute('aria-label'));

describe('Collection', () => {
  beforeEach(() => localStorage.clear());

  it('cabeçalho: "Sua coleção", contador, busca, "Organizar por" e fechar', () => {
    setup();
    expect(screen.getByRole('dialog', { name: 'Sua coleção' })).toBeInTheDocument();
    expect(screen.getByText('3 discos')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Buscar na coleção' })).toBeInTheDocument();
    expect(sortSelect()).toHaveValue('tags');
    expect(screen.getByRole('button', { name: 'Fechar coleção' })).toHaveFocus();
  });

  it('sem madeira: nada da estante de móvel antiga', () => {
    const { container } = render(<Collection discs={[kob]} onOpen={vi.fn()} onPlay={vi.fn()} onClose={vi.fn()} onDrop={vi.fn()} />);
    expect(container.querySelector('.bookcase')).toBeNull();
  });

  describe('modo Etiquetas (padrão)', () => {
    it('uma seção por etiqueta em ordem alfabética, "Sem etiqueta" por último, com contagem', () => {
      setup();
      expect(titles()).toEqual(['Jazz · 1', 'Para trabalhar · 1', 'Rock · 1', 'Sem etiqueta · 1']);
    });

    it('disco com várias etiquetas aparece em cada seção', () => {
      setup();
      expect(screen.getAllByRole('button', { name: 'Abrir Kind of Blue' })).toHaveLength(2);
      expect(within(screen.getByRole('list', { name: 'Jazz' })).getByRole('button', { name: 'Abrir Kind of Blue' })).toBeInTheDocument();
    });

    it('não arrasta', () => {
      setup();
      expect(screen.getAllByRole('button', { name: 'Abrir Kind of Blue' })[0]).not.toHaveAttribute('aria-roledescription');
    });
  });

  describe('demais modos: grade única', () => {
    it('Artista: A–Z', async () => {
      setup();
      await userEvent.selectOptions(sortSelect(), 'Artista');
      expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);
      expect(gridNames()).toEqual(['Abrir Café', 'Abrir Kind of Blue', 'Abrir Nevermind']);
    });

    it('Adicionados recentemente: mais novo primeiro, sem data no fim', async () => {
      setup();
      await userEvent.selectOptions(sortSelect(), 'Adicionados recentemente');
      expect(gridNames()).toEqual(['Abrir Nevermind', 'Abrir Kind of Blue', 'Abrir Café']);
    });

    it('Minha ordem: ordem da estante, e só aqui as capas são arrastáveis', async () => {
      setup();
      await userEvent.selectOptions(sortSelect(), 'Artista');
      expect(screen.getByRole('button', { name: 'Abrir Café' })).not.toHaveAttribute('aria-roledescription');
      await userEvent.selectOptions(sortSelect(), 'Minha ordem');
      expect(gridNames()).toEqual(['Abrir Kind of Blue', 'Abrir Nevermind', 'Abrir Café']);
      expect(screen.getByRole('button', { name: 'Abrir Café' })).toHaveAttribute('aria-roledescription', 'sortable');
    });
  });

  it('o modo escolhido persiste ao reabrir', async () => {
    setup();
    await userEvent.selectOptions(sortSelect(), 'Artista');
    document.body.innerHTML = '';
    setup();
    expect(sortSelect()).toHaveValue('artist');
  });

  describe('busca', () => {
    it('por nome ou artista, sem acento; o contador mostra "X de Y"', async () => {
      setup();
      await userEvent.type(screen.getByRole('searchbox'), 'angela');
      expect(screen.getByText('1 de 3 discos')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Abrir Café' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Abrir Nevermind' })).not.toBeInTheDocument();
    });

    it('nada encontrado: aviso', async () => {
      setup();
      await userEvent.type(screen.getByRole('searchbox'), 'xyz');
      expect(screen.getByText('Nenhum disco encontrado para "xyz".')).toBeInTheDocument();
    });

    it('Esc com texto limpa a busca sem fechar; com o campo vazio, fecha', async () => {
      const { onClose } = setup();
      await userEvent.type(screen.getByRole('searchbox'), 'nir');
      await userEvent.keyboard('{Escape}');
      expect(screen.getByRole('searchbox')).toHaveValue('');
      expect(onClose).not.toHaveBeenCalled();
      await userEvent.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('com busca, "Minha ordem" não arrasta', async () => {
      setup();
      await userEvent.selectOptions(sortSelect(), 'Minha ordem');
      await userEvent.type(screen.getByRole('searchbox'), 'n');
      expect(screen.getByRole('button', { name: 'Abrir Nevermind' })).not.toHaveAttribute('aria-roledescription');
      expect(screen.getByText('Para reorganizar arrastando, limpe o filtro e a busca.')).toBeInTheDocument();
    });
  });

  describe('capas', () => {
    it('clicar abre os detalhes sem fechar a coleção', async () => {
      const { onOpen, onClose } = setup();
      await userEvent.click(screen.getByRole('button', { name: 'Abrir Nevermind' }));
      expect(onOpen).toHaveBeenCalledWith(nevermind);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('botão tocar sobre a capa toca aquele disco', async () => {
      const { onPlay, onOpen } = setup();
      await userEvent.click(screen.getByRole('button', { name: 'Tocar Nevermind' }));
      expect(onPlay).toHaveBeenCalledWith(nevermind);
      expect(onOpen).not.toHaveBeenCalled();
    });

    it('disco tocando: anel âmbar e o botão vira pausar', () => {
      setup({ playingUri: 'spotify:album:a2' });
      expect(screen.getByRole('button', { name: 'Abrir Nevermind' })).toHaveClass('collection__disc--playing');
      expect(screen.getByRole('button', { name: 'Abrir Café' })).not.toHaveClass('collection__disc--playing');
      expect(screen.getByRole('button', { name: 'Pausar Nevermind' })).toBeInTheDocument();
    });
  });

  it('fecha com Esc, clique fora e ×, mas não com clique dentro', async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole('heading', { name: 'Sua coleção' }));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId('collection-backdrop'));
    await userEvent.click(screen.getByRole('button', { name: 'Fechar coleção' }));
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('coleção vazia mostra aviso, sem busca nem seletor', () => {
    setup({ discs: [] });
    expect(screen.getByText(/Sua coleção está vazia/)).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.getByText('0 discos')).toBeInTheDocument();
  });

  describe('arrastar em "Minha ordem"', () => {
    beforeEach(() => localStorage.setItem('vinil.collection.sort', 'custom'));

    it('instruções em português para leitor de tela', () => {
      setup();
      const cover = screen.getByRole('button', { name: 'Abrir Kind of Blue' });
      const help = document.getElementById(cover.getAttribute('aria-describedby') ?? '');
      expect(help).toHaveTextContent('aperte Espaço, use as setas e aperte Espaço de novo para soltar');
    });

    it('teclado: Espaço pega e solta (chama onDrop) sem abrir os detalhes; Enter continua abrindo', async () => {
      const { onDrop, onOpen, onClose } = setup();
      const cover = screen.getByRole('button', { name: 'Abrir Kind of Blue' });
      cover.focus();
      await userEvent.keyboard(' ');
      await userEvent.keyboard(' ');
      expect(onDrop).toHaveBeenCalledWith('a1', 'a1');
      expect(onOpen).not.toHaveBeenCalled();

      await new Promise((r) => setTimeout(r, 300));
      cover.focus();
      await userEvent.keyboard('{Enter}');
      expect(onOpen).toHaveBeenCalledWith(kob);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('Esc durante o arrasto cancela sem fechar a coleção', async () => {
      const { onDrop, onClose } = setup();
      screen.getByRole('button', { name: 'Abrir Kind of Blue' }).focus();
      await userEvent.keyboard(' ');
      await userEvent.keyboard('{Escape}');
      expect(onDrop).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('com filtro por etiqueta', () => {
    it('mostra os chips, só os discos filtrados, contador "X de Y" e o arrastar fica desligado', () => {
      localStorage.setItem('vinil.collection.sort', 'custom');
      setup({ discs: [kob], total: 3, filtered: true, filter: <div>chips</div> });
      expect(screen.getByText('chips')).toBeInTheDocument();
      expect(screen.getByText('1 de 3 discos')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Abrir Nevermind' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Abrir Kind of Blue' })).not.toHaveAttribute('aria-roledescription');
    });

    it('nada com essas etiquetas: aviso', () => {
      setup({ discs: [], total: 3, filtered: true });
      expect(screen.getByText('Nenhum disco com essas etiquetas.')).toBeInTheDocument();
    });
  });
});
