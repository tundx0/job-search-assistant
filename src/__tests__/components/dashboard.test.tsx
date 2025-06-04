import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from '@/components/dashboard/dashboard';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}));

describe('Dashboard Component', () => {
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
  };

  const mockApplications = [
    {
      id: 'job1',
      title: 'Software Engineer',
      company: 'Tech Co',
      status: 'APPLIED',
      createdAt: new Date('2025-05-20').toISOString(),
      updatedAt: new Date('2025-05-20').toISOString(),
    },
    {
      id: 'job2',
      title: 'Frontend Developer',
      company: 'Startup Inc',
      status: 'INTERVIEW',
      createdAt: new Date('2025-05-15').toISOString(),
      updatedAt: new Date('2025-05-25').toISOString(),
    },
    {
      id: 'job3',
      title: 'Full Stack Developer',
      company: 'Enterprise Corp',
      status: 'REJECTED',
      createdAt: new Date('2025-05-10').toISOString(),
      updatedAt: new Date('2025-05-22').toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/jobs')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ applications: mockApplications }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('renders dashboard with job applications', async () => {
    render(<Dashboard user={mockUser} />);
    
    // Wait for applications to load
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      expect(screen.getByText('Full Stack Developer')).toBeInTheDocument();
    });
    
    // Check company names
    expect(screen.getByText('Tech Co')).toBeInTheDocument();
    expect(screen.getByText('Startup Inc')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Corp')).toBeInTheDocument();
    
    // Check status badges
    expect(screen.getByText('APPLIED')).toBeInTheDocument();
    expect(screen.getByText('INTERVIEW')).toBeInTheDocument();
    expect(screen.getByText('REJECTED')).toBeInTheDocument();
  });

  it('displays statistics correctly', async () => {
    render(<Dashboard user={mockUser} />);
    
    // Wait for applications to load
    await waitFor(() => {
      expect(screen.getByText('Total Applications')).toBeInTheDocument();
    });
    
    // Check statistics
    expect(screen.getByText('3')).toBeInTheDocument(); // Total applications
    expect(screen.getByText('1')).toBeInTheDocument(); // Applied
    expect(screen.getByText('1')).toBeInTheDocument(); // Interview
    expect(screen.getByText('1')).toBeInTheDocument(); // Rejected
  });

  it('filters applications by status', async () => {
    const user = userEvent.setup();
    render(<Dashboard user={mockUser} />);
    
    // Wait for applications to load
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });
    
    // Find and click the Interview filter
    const interviewFilter = screen.getByText('Interview');
    await user.click(interviewFilter);
    
    // Check that only the interview application is shown
    await waitFor(() => {
      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      expect(screen.queryByText('Full Stack Developer')).not.toBeInTheDocument();
    });
  });

  it('sorts applications by date', async () => {
    const user = userEvent.setup();
    render(<Dashboard user={mockUser} />);
    
    // Wait for applications to load
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });
    
    // Find and click the sort dropdown
    const sortDropdown = screen.getByRole('combobox');
    await user.click(sortDropdown);
    
    // Select "Oldest First"
    const oldestOption = screen.getByText('Oldest First');
    await user.click(oldestOption);
    
    // Check that applications are sorted by date (oldest first)
    const applications = screen.getAllByRole('row').slice(1); // Skip header row
    expect(applications[0]).toHaveTextContent('Full Stack Developer');
    expect(applications[1]).toHaveTextContent('Frontend Developer');
    expect(applications[2]).toHaveTextContent('Software Engineer');
  });

  it('handles empty applications list', async () => {
    // Mock empty applications response
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ applications: [] }),
      })
    );
    
    render(<Dashboard user={mockUser} />);
    
    // Wait for applications to load
    await waitFor(() => {
      expect(screen.getByText('No job applications found')).toBeInTheDocument();
    });
    
    // Check for the "Create New Application" button
    expect(screen.getByText('Create New Application')).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    // Mock API error
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      })
    );
    
    render(<Dashboard user={mockUser} />);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to load job applications')).toBeInTheDocument();
    });
  });
});
