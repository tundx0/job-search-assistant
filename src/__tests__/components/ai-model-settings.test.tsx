import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AiModelSettings } from '@/components/settings/ai-model-settings';
import { toast } from 'sonner';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AiModelSettings Component', () => {
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
              { id: '3', provider: 'anthropic', key: 'sk-***' },
              { id: '4', provider: 'deepseek', key: 'sk-***' },
            ],
          }),
        });
      } else if (url.includes('/api/settings/ai-model-preference')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            provider: 'openai',
            model: 'gpt-4',
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

  it('renders all AI providers', async () => {
    render(<AiModelSettings user={mockUser} />);
    
    // Wait for the component to load data
    await waitFor(() => {
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('Anthropic')).toBeInTheDocument();
      expect(screen.getByText('DeepSeek')).toBeInTheDocument();
    });
  });

  it('loads user preferences on mount', async () => {
    render(<AiModelSettings user={mockUser} />);
    
    await waitFor(() => {
      // Check if the default provider is selected
      const openaiOption = screen.getByText('OpenAI');
      expect(openaiOption.closest('button')).toHaveAttribute('aria-checked', 'true');
    });
  });

  it('saves preferences when the save button is clicked', async () => {
    render(<AiModelSettings user={mockUser} />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });
    
    // Click the save button
    fireEvent.click(screen.getByText('Save Preferences'));
    
    // Verify the API was called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/settings/ai-model-preference',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('AI model preferences saved successfully!');
    });
  });

  it('handles errors when saving preferences fails', async () => {
    // Mock a failed API response
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      })
    );
    
    render(<AiModelSettings user={mockUser} />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });
    
    // Click the save button
    fireEvent.click(screen.getByText('Save Preferences'));
    
    // Verify error handling
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save AI model preferences');
    });
  });

  it('changes the selected provider when clicked', async () => {
    render(<AiModelSettings user={mockUser} />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Google')).toBeInTheDocument();
    });
    
    // Click on Google provider
    fireEvent.click(screen.getByText('Google'));
    
    // Verify Google is now selected
    await waitFor(() => {
      const googleOption = screen.getByText('Google');
      expect(googleOption.closest('button')).toHaveAttribute('aria-checked', 'true');
    });
  });
});
