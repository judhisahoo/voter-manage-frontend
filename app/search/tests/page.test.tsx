import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchPage from '../page';
import axios from '@/lib/axios';

jest.mock('@/lib/axios');
jest.mock('@/components/DashboardLayout', () => {
  return function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="dashboard-layout">{children}</div>;
  };
});

describe('SearchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search page', () => {
    render(<SearchPage />);

    expect(screen.getByText('Search Voter Data')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/XKQ5571104/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('handles successful search', async () => {
    const mockResults = [
      {
        epic_no: 'XKQ5571104',
        name: 'RAHUL GOTI',
        age: '26',
        gender: 'Male',
        state: 'GUJARAT',
        district: 'BOTAD',
        status: 'VALID',
        dataSource: 'cache',
      },
    ];

    (axios.post as jest.Mock).mockResolvedValue({ data: mockResults });

    render(<SearchPage />);
    const user = userEvent.setup();

    const searchInput = screen.getByPlaceholderText(/XKQ5571104/);
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(searchInput, 'XKQ5571104');
    await user.click(searchButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/voter-data/search', {
        epicNumbers: 'XKQ5571104',
      });
      expect(screen.getByText('RAHUL GOTI')).toBeInTheDocument();
      expect(screen.getByText('GUJARAT')).toBeInTheDocument();
    });
  });

  it('displays error for empty search', async () => {
    render(<SearchPage />);
    const user = userEvent.setup();

    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    expect(screen.getByText('Please enter at least one EPIC number')).toBeInTheDocument();
  });

  it('displays error message on search failure', async () => {
    (axios.post as jest.Mock).mockRejectedValue({
      response: {
        data: {
          message: 'Search failed',
        },
      },
    });

    render(<SearchPage />);
    const user = userEvent.setup();

    const searchInput = screen.getByPlaceholderText(/XKQ5571104/);
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(searchInput, 'XKQ5571104');
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Search failed')).toBeInTheDocument();
    });
  });

  it('shows loading state while searching', async () => {
    (axios.post as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<SearchPage />);
    const user = userEvent.setup();

    const searchInput = screen.getByPlaceholderText(/XKQ5571104/);
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(searchInput, 'XKQ5571104');
    await user.click(searchButton);

    expect(screen.getByText('Searching...')).toBeInTheDocument();
    expect(searchButton).toBeDisabled();
  });

  it('handles multiple EPIC numbers', async () => {
    const mockResults = [
      { epic_no: 'XKQ5571104', name: 'User 1', dataSource: 'cache' },
      { epic_no: 'XKQ5571105', name: 'User 2', dataSource: 'database' },
    ];

    (axios.post as jest.Mock).mockResolvedValue({ data: mockResults });

    render(<SearchPage />);
    const user = userEvent.setup();

    const searchInput = screen.getByPlaceholderText(/XKQ5571104/);
    await user.type(searchInput, 'XKQ5571104, XKQ5571105');

    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('User 1')).toBeInTheDocument();
      expect(screen.getByText('User 2')).toBeInTheDocument();
    });
  });
});