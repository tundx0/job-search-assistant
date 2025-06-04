import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JobApplicationForm } from '@/components/jobs/job-application-form';
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

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}));

// Mock AI generation
jest.mock('@/lib/ai/enhanced-provider', () => ({
  generateText: jest.fn().mockResolvedValue('AI generated content'),
  getAvailableModels: jest.fn().mockReturnValue([
    { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
    { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro', provider: 'google' },
  ]),
}));

describe('JobApplicationForm Component', () => {
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/settings/ai-model-preference')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ provider: 'openai', model: 'gpt-4' }),
        });
      } else if (url.includes('/api/jobs')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            job: {
              id: 'new-job',
              title: 'Software Engineer',
              company: 'Tech Co',
              description: 'Job description',
              status: 'APPLIED',
              userId: 'user-123',
            } 
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('renders job application form', () => {
    render(<JobApplicationForm user={mockUser} />);
    
    // Check form elements
    expect(screen.getByLabelText(/job title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/job description/i)).toBeInTheDocument();
    expect(screen.getByText(/generate resume/i)).toBeInTheDocument();
    expect(screen.getByText(/generate cover letter/i)).toBeInTheDocument();
  });

  it('submits form with job details', async () => {
    const user = userEvent.setup();
    render(<JobApplicationForm user={mockUser} />);
    
    // Fill out the form
    await user.type(screen.getByLabelText(/job title/i), 'Software Engineer');
    await user.type(screen.getByLabelText(/company/i), 'Tech Co');
    await user.type(screen.getByLabelText(/job description/i), 'We are looking for a skilled software engineer...');
    
    // Submit the form
    await user.click(screen.getByText(/save application/i));
    
    // Verify API was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/jobs',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Software Engineer'),
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Job application saved successfully!');
    });
  });

  it('generates resume when button is clicked', async () => {
    const user = userEvent.setup();
    render(<JobApplicationForm user={mockUser} />);
    
    // Fill out the form
    await user.type(screen.getByLabelText(/job title/i), 'Software Engineer');
    await user.type(screen.getByLabelText(/company/i), 'Tech Co');
    await user.type(screen.getByLabelText(/job description/i), 'We are looking for a skilled software engineer...');
    
    // Click generate resume button
    await user.click(screen.getByText(/generate resume/i));
    
    // Verify AI generation was called
    await waitFor(() => {
      expect(screen.getByText(/generating resume/i)).toBeInTheDocument();
    });
    
    // Verify resume was generated
    await waitFor(() => {
      expect(screen.getByText(/ai generated content/i)).toBeInTheDocument();
    });
  });

  it('generates cover letter when button is clicked', async () => {
    const user = userEvent.setup();
    render(<JobApplicationForm user={mockUser} />);
    
    // Fill out the form
    await user.type(screen.getByLabelText(/job title/i), 'Software Engineer');
    await user.type(screen.getByLabelText(/company/i), 'Tech Co');
    await user.type(screen.getByLabelText(/job description/i), 'We are looking for a skilled software engineer...');
    
    // Click generate cover letter button
    await user.click(screen.getByText(/generate cover letter/i));
    
    // Verify AI generation was called
    await waitFor(() => {
      expect(screen.getByText(/generating cover letter/i)).toBeInTheDocument();
    });
    
    // Verify cover letter was generated
    await waitFor(() => {
      expect(screen.getByText(/ai generated content/i)).toBeInTheDocument();
    });
  });

  it('handles form validation errors', async () => {
    const user = userEvent.setup();
    render(<JobApplicationForm user={mockUser} />);
    
    // Submit the form without filling it out
    await user.click(screen.getByText(/save application/i));
    
    // Check for validation error messages
    await waitFor(() => {
      expect(screen.getByText(/job title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/company is required/i)).toBeInTheDocument();
      expect(screen.getByText(/job description is required/i)).toBeInTheDocument();
    });
    
    // Verify API was not called
    expect(global.fetch).not.toHaveBeenCalledWith(
      '/api/jobs',
      expect.any(Object)
    );
  });

  it('handles API errors when saving job application', async () => {
    // Mock API error
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      })
    );
    
    const user = userEvent.setup();
    render(<JobApplicationForm user={mockUser} />);
    
    // Fill out the form
    await user.type(screen.getByLabelText(/job title/i), 'Software Engineer');
    await user.type(screen.getByLabelText(/company/i), 'Tech Co');
    await user.type(screen.getByLabelText(/job description/i), 'We are looking for a skilled software engineer...');
    
    // Submit the form
    await user.click(screen.getByText(/save application/i));
    
    // Verify error handling
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save job application');
    });
  });

  it('handles AI generation errors', async () => {
    // Mock AI generation error
    jest.requireMock('@/lib/ai/enhanced-provider').generateText.mockRejectedValueOnce(
      new Error('AI generation failed')
    );
    
    const user = userEvent.setup();
    render(<JobApplicationForm user={mockUser} />);
    
    // Fill out the form
    await user.type(screen.getByLabelText(/job title/i), 'Software Engineer');
    await user.type(screen.getByLabelText(/company/i), 'Tech Co');
    await user.type(screen.getByLabelText(/job description/i), 'We are looking for a skilled software engineer...');
    
    // Click generate resume button
    await user.click(screen.getByText(/generate resume/i));
    
    // Verify error handling
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to generate resume: AI generation failed');
    });
  });
});
