import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ApiKeysSettings } from '@/components/settings/api-keys-settings';
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

describe('ApiKeysSettings Component', () => {
  const mockUser = {
    id: '123',
    name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/settings/api-keys')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            keys: [
              { id: '1', provider: 'openai', key: 'sk-***' },
              { id: '2', provider: 'google', key: 'sk-***' },
            ],
          }),
        });
      } else {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      }
    });
  });

  it('renders all API provider cards', async () => {
    render(<ApiKeysSettings user={mockUser} />);
    
    // Wait for the component to load data
    await waitFor(() => {
      expect(screen.getByText('OpenAI API Key')).toBeInTheDocument();
      expect(screen.getByText('Google API Key')).toBeInTheDocument();
      expect(screen.getByText('Anthropic API Key')).toBeInTheDocument();
      expect(screen.getByText('DeepSeek API Key')).toBeInTheDocument();
    });
  });

  it('loads existing API keys on mount', async () => {
    render(<ApiKeysSettings user={mockUser} />);
    
    await waitFor(() => {
      // Check if the saved keys are displayed as masked
      const maskedKeys = screen.getAllByText('sk-***');
      expect(maskedKeys.length).toBe(2);
    });
  });

  it('adds a new API key when save button is clicked', async () => {
    const user = userEvent.setup();
    render(<ApiKeysSettings user={mockUser} />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('OpenAI API Key')).toBeInTheDocument();
    });
    
    // Find the OpenAI input field and add button
    const openaiInput = screen.getAllByPlaceholderText('Enter API key')[0];
    
    // Type a new API key
    await user.type(openaiInput, 'sk-newopenaikey123456');
    
    // Find and click the Save button for OpenAI
    const saveButtons = screen.getAllByText('Save');
    await user.click(saveButtons[0]);
    
    // Verify the API was called with the correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/settings/api-keys',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('sk-newopenaikey123456'),
        })
      );
      expect(toast.success).toHaveBeenCalledWith('API key saved successfully!');
    });
  });

  it('deletes an API key when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<ApiKeysSettings user={mockUser} />);
    
    // Wait for component to load and display existing keys
    await waitFor(() => {
      expect(screen.getAllByText('sk-***').length).toBe(2);
    });
    
    // Find and click the first Delete button
    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);
    
    // Verify the API was called with the correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/settings/api-keys/'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('API key deleted successfully!');
    });
  });

  it('toggles visibility of API keys when eye icon is clicked', async () => {
    const user = userEvent.setup();
    render(<ApiKeysSettings user={mockUser} />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getAllByText('sk-***').length).toBe(2);
    });
    
    // Find and click the eye icon to toggle visibility
    const eyeIcons = screen.getAllByLabelText('Toggle visibility');
    await user.click(eyeIcons[0]);
    
    // Verify the API was called to get the unmasked key
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/settings/api-keys/'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  it('handles errors when saving API keys fails', async () => {
    // Mock a failed API response
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      })
    );
    
    const user = userEvent.setup();
    render(<ApiKeysSettings user={mockUser} />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('OpenAI API Key')).toBeInTheDocument();
    });
    
    // Find the OpenAI input field and add button
    const openaiInput = screen.getAllByPlaceholderText('Enter API key')[0];
    
    // Type a new API key
    await user.type(openaiInput, 'sk-newopenaikey123456');
    
    // Find and click the Save button for OpenAI
    const saveButtons = screen.getAllByText('Save');
    await user.click(saveButtons[0]);
    
    // Verify error handling
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save API key');
    });
  });
});
