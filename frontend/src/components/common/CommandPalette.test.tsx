// @vitest-environment jsdom
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { CommandPalette } from './CommandPalette';

const closeCommandPalette = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../../stores/RootStore', () => ({
  useStore: () => ({
    uiStore: {
      commandPaletteOpen: true,
      closeCommandPalette,
    },
    customerStore: {
      fetchCustomers: vi.fn(),
      customers: [],
    },
    vehicleStore: {
      fetchVehicles: vi.fn(),
      vehicles: [],
      limit: 50,
      page: 1,
      search: '',
      setSearch: vi.fn(),
      setPage: vi.fn(),
    },
    authStore: {
      canEdit: true,
    },
  }),
}));

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: ResizeObserver,
  });
});

describe('CommandPalette', () => {
  it('renders primary commands when open', () => {
    render(<CommandPalette />);

    expect(screen.getByText('Go to Jobs')).toBeInTheDocument();
    expect(screen.getByText('Go to Customers')).toBeInTheDocument();
    expect(screen.getByText('Go to Inventory')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('New Job')).toBeInTheDocument();
    expect(screen.getByText('New Customer')).toBeInTheDocument();
  });
});
