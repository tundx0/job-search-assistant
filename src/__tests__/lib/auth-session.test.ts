import { getSession, getCurrentUser } from '@/lib/auth/session';
import { getServerSession } from 'next-auth/next';

// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

describe('Auth Session Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSession', () => {
    it('returns session when user is authenticated', async () => {
      const mockSession = {
        user: {
          name: 'Test User',
          email: 'test@example.com',
          image: 'https://example.com/avatar.jpg',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const session = await getSession();

      expect(session).toEqual(mockSession);
      expect(getServerSession).toHaveBeenCalledTimes(1);
    });

    it('returns null when no session exists', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const session = await getSession();

      expect(session).toBeNull();
      expect(getServerSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCurrentUser', () => {
    it('returns user when session exists', async () => {
      const mockUser = {
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
      };

      (getServerSession as jest.Mock).mockResolvedValue({
        user: mockUser,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      const user = await getCurrentUser();

      expect(user).toEqual(mockUser);
    });

    it('returns null when no session exists', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });

    it('returns null when session exists but has no user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });

    it('returns null when session exists but user has no email', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          name: 'Test User',
          // No email
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });
  });
});
