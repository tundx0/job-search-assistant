import React from 'react';
import { render, screen } from '@testing-library/react';
import { Navigation } from '@/components/navigation';
import { usePathname } from 'next/navigation';

// Mock the next/navigation hook
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('Navigation Component', () => {
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    image: 'https://example.com/avatar.png',
  };

  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
  });

  it('renders navigation links correctly', () => {
    render(<Navigation user={mockUser} />);
    
    // Check if all navigation links are rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('New Application')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('highlights the active link based on current path', () => {
    render(<Navigation user={mockUser} />);
    
    // The Dashboard link should be highlighted as active
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('bg-accent');
    
    // Other links should not be highlighted
    const newAppLink = screen.getByText('New Application').closest('a');
    expect(newAppLink).not.toHaveClass('bg-accent');
  });

  it('displays user name when provided', () => {
    render(<Navigation user={mockUser} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});
