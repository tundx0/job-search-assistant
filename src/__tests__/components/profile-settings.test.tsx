import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ProfileSettings } from '@/components/settings/profile-settings';
import { toast } from 'sonner';
import userEvent from '@testing-library/user-event';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('ProfileSettings Component', () => {
  const mockUser = {
    id: '123',
    name: 'Test User',
    email: 'test@example.com',
    bio: 'Test bio',
    location: 'Test location',
    phone: '1234567890',
    linkedin: 'https://linkedin.com/in/testuser',
    github: 'https://github.com/testuser',
    website: 'https://testuser.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    (global.fetch as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );
  });

  it('renders profile form with user data', () => {
    render(<ProfileSettings user={mockUser} />);
    
    // Check if user data is displayed in the form
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test location')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://linkedin.com/in/testuser')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://github.com/testuser')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://testuser.com')).toBeInTheDocument();
  });

  it('updates personal information when form is submitted', async () => {
    const user = userEvent.setup();
    render(<ProfileSettings user={mockUser} />);
    
    // Find the name input and update it
    const nameInput = screen.getByDisplayValue('Test User');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated User');
    
    // Find and click the Update Personal Info button
    const updateButton = screen.getByText('Update Personal Info');
    await user.click(updateButton);
    
    // Verify the API was called with the correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/profile',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('Updated User'),
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Profile updated successfully!');
    });
  });

  it('updates social profiles when form is submitted', async () => {
    const user = userEvent.setup();
    render(<ProfileSettings user={mockUser} />);
    
    // Find the LinkedIn input and update it
    const linkedinInput = screen.getByDisplayValue('https://linkedin.com/in/testuser');
    await user.clear(linkedinInput);
    await user.type(linkedinInput, 'https://linkedin.com/in/updateduser');
    
    // Find and click the Update Social Profiles button
    const updateButton = screen.getByText('Update Social Profiles');
    await user.click(updateButton);
    
    // Verify the API was called with the correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/profile/social',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('https://linkedin.com/in/updateduser'),
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Social profiles updated successfully!');
    });
  });

  it('handles errors when updating profile fails', async () => {
    // Mock a failed API response
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      })
    );
    
    const user = userEvent.setup();
    render(<ProfileSettings user={mockUser} />);
    
    // Find and click the Update Personal Info button without changing anything
    const updateButton = screen.getByText('Update Personal Info');
    await user.click(updateButton);
    
    // Verify error handling
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update profile');
    });
  });

  it('validates form inputs before submission', async () => {
    const user = userEvent.setup();
    render(<ProfileSettings user={mockUser} />);
    
    // Find the email input and update it with an invalid email
    const emailInput = screen.getByDisplayValue('test@example.com');
    await user.clear(emailInput);
    await user.type(emailInput, 'invalid-email');
    
    // Find and click the Update Personal Info button
    const updateButton = screen.getByText('Update Personal Info');
    await user.click(updateButton);
    
    // Check for validation error message
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
    
    // Verify the API was not called
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
