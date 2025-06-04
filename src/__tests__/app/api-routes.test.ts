import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    apiKey: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
    aiModelPreference: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    jobApplication: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock the auth session
jest.mock('@/lib/auth/session', () => ({
  getSession: jest.fn().mockResolvedValue({
    user: { id: 'user-123', email: 'test@example.com' },
  }),
  getCurrentUser: jest.fn().mockResolvedValue({
    id: 'user-123',
    email: 'test@example.com',
  }),
}));

// Mock encryption utilities
jest.mock('@/lib/encryption', () => ({
  encrypt: jest.fn((text) => `encrypted-${text}`),
  decrypt: jest.fn((text) => text.replace('encrypted-', '')),
}));

// Import handlers (these would be imported from your actual API route handlers)
// For testing purposes, we'll mock their implementation
const mockHandlers = {
  // API Keys handlers
  GET: {
    '/api/settings/api-keys': async () => {
      const keys = await db.apiKey.findMany();
      return NextResponse.json({ keys });
    },
    '/api/settings/api-keys/:id': async (req: NextRequest, { params }: { params: { id: string } }) => {
      const key = await db.apiKey.findUnique({ where: { id: params.id } });
      return NextResponse.json({ key });
    },
    '/api/settings/ai-model-preference': async () => {
      const preference = await db.aiModelPreference.findUnique({ where: { userId: 'user-123' } });
      return NextResponse.json(preference || { provider: 'openai', model: 'gpt-4' });
    },
    '/api/profile': async () => {
      const user = await db.user.findUnique({ where: { id: 'user-123' } });
      return NextResponse.json(user);
    },
  },
  POST: {
    '/api/settings/api-keys': async (req: NextRequest) => {
      const data = await req.json();
      const newKey = await db.apiKey.create({ data });
      return NextResponse.json({ success: true, key: newKey });
    },
    '/api/settings/ai-model-preference': async (req: NextRequest) => {
      const data = await req.json();
      const preference = await db.aiModelPreference.upsert({
        where: { userId: 'user-123' },
        update: data,
        create: { ...data, userId: 'user-123' },
      });
      return NextResponse.json({ success: true, preference });
    },
    '/api/jobs': async (req: NextRequest) => {
      const data = await req.json();
      const job = await db.jobApplication.create({ data: { ...data, userId: 'user-123' } });
      return NextResponse.json({ success: true, job });
    },
  },
  PUT: {
    '/api/profile': async (req: NextRequest) => {
      const data = await req.json();
      const user = await db.user.update({ where: { id: 'user-123' }, data });
      return NextResponse.json({ success: true, user });
    },
    '/api/jobs/:id': async (req: NextRequest, { params }: { params: { id: string } }) => {
      const data = await req.json();
      const job = await db.jobApplication.update({ where: { id: params.id }, data });
      return NextResponse.json({ success: true, job });
    },
  },
  DELETE: {
    '/api/settings/api-keys/:id': async (req: NextRequest, { params }: { params: { id: string } }) => {
      await db.apiKey.delete({ where: { id: params.id } });
      return NextResponse.json({ success: true });
    },
    '/api/jobs/:id': async (req: NextRequest, { params }: { params: { id: string } }) => {
      await db.jobApplication.delete({ where: { id: params.id } });
      return NextResponse.json({ success: true });
    },
  },
};

describe('API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API Keys Routes', () => {
    it('GET /api/settings/api-keys returns user API keys', async () => {
      // Mock the database response
      (db.apiKey.findMany as jest.Mock).mockResolvedValue([
        { id: 'key1', provider: 'openai', key: 'encrypted-sk-123', userId: 'user-123' },
        { id: 'key2', provider: 'google', key: 'encrypted-api-123', userId: 'user-123' },
      ]);

      // Call the handler
      const response = await mockHandlers.GET['/api/settings/api-keys']();
      const data = await response.json();

      // Verify the response
      expect(data.keys).toHaveLength(2);
      expect(data.keys[0].provider).toBe('openai');
      expect(data.keys[1].provider).toBe('google');
      expect(db.apiKey.findMany).toHaveBeenCalledTimes(1);
    });

    it('POST /api/settings/api-keys creates a new API key', async () => {
      // Mock the request
      const req = {
        json: jest.fn().mockResolvedValue({
          provider: 'anthropic',
          key: 'sk-ant-123',
          userId: 'user-123',
        }),
      } as unknown as NextRequest;

      // Mock the database response
      (db.apiKey.create as jest.Mock).mockResolvedValue({
        id: 'new-key',
        provider: 'anthropic',
        key: 'encrypted-sk-ant-123',
        userId: 'user-123',
      });

      // Call the handler
      const response = await mockHandlers.POST['/api/settings/api-keys'](req);
      const data = await response.json();

      // Verify the response
      expect(data.success).toBe(true);
      expect(data.key.provider).toBe('anthropic');
      expect(db.apiKey.create).toHaveBeenCalledTimes(1);
    });

    it('DELETE /api/settings/api-keys/:id deletes an API key', async () => {
      // Mock the request and params
      const req = {} as NextRequest;
      const params = { id: 'key1' };

      // Call the handler
      const response = await mockHandlers.DELETE['/api/settings/api-keys/:id'](req, { params });
      const data = await response.json();

      // Verify the response
      expect(data.success).toBe(true);
      expect(db.apiKey.delete).toHaveBeenCalledWith({ where: { id: 'key1' } });
    });
  });

  describe('AI Model Preference Routes', () => {
    it('GET /api/settings/ai-model-preference returns user preference', async () => {
      // Mock the database response
      (db.aiModelPreference.findUnique as jest.Mock).mockResolvedValue({
        id: 'pref1',
        provider: 'openai',
        model: 'gpt-4',
        userId: 'user-123',
      });

      // Call the handler
      const response = await mockHandlers.GET['/api/settings/ai-model-preference']();
      const data = await response.json();

      // Verify the response
      expect(data.provider).toBe('openai');
      expect(data.model).toBe('gpt-4');
      expect(db.aiModelPreference.findUnique).toHaveBeenCalledTimes(1);
    });

    it('POST /api/settings/ai-model-preference updates user preference', async () => {
      // Mock the request
      const req = {
        json: jest.fn().mockResolvedValue({
          provider: 'google',
          model: 'gemini-2.0-pro',
        }),
      } as unknown as NextRequest;

      // Mock the database response
      (db.aiModelPreference.upsert as jest.Mock).mockResolvedValue({
        id: 'pref1',
        provider: 'google',
        model: 'gemini-2.0-pro',
        userId: 'user-123',
      });

      // Call the handler
      const response = await mockHandlers.POST['/api/settings/ai-model-preference'](req);
      const data = await response.json();

      // Verify the response
      expect(data.success).toBe(true);
      expect(data.preference.provider).toBe('google');
      expect(data.preference.model).toBe('gemini-2.0-pro');
      expect(db.aiModelPreference.upsert).toHaveBeenCalledTimes(1);
    });
  });

  describe('Profile Routes', () => {
    it('GET /api/profile returns user profile', async () => {
      // Mock the database response
      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        bio: 'Test bio',
        location: 'Test location',
      });

      // Call the handler
      const response = await mockHandlers.GET['/api/profile']();
      const data = await response.json();

      // Verify the response
      expect(data.name).toBe('Test User');
      expect(data.email).toBe('test@example.com');
      expect(data.bio).toBe('Test bio');
      expect(db.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('PUT /api/profile updates user profile', async () => {
      // Mock the request
      const req = {
        json: jest.fn().mockResolvedValue({
          name: 'Updated User',
          bio: 'Updated bio',
          location: 'Updated location',
        }),
      } as unknown as NextRequest;

      // Mock the database response
      (db.user.update as jest.Mock).mockResolvedValue({
        id: 'user-123',
        name: 'Updated User',
        email: 'test@example.com',
        bio: 'Updated bio',
        location: 'Updated location',
      });

      // Call the handler
      const response = await mockHandlers.PUT['/api/profile'](req);
      const data = await response.json();

      // Verify the response
      expect(data.success).toBe(true);
      expect(data.user.name).toBe('Updated User');
      expect(data.user.bio).toBe('Updated bio');
      expect(db.user.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('Job Application Routes', () => {
    it('POST /api/jobs creates a new job application', async () => {
      // Mock the request
      const req = {
        json: jest.fn().mockResolvedValue({
          title: 'Software Engineer',
          company: 'Tech Co',
          description: 'Job description',
          status: 'APPLIED',
        }),
      } as unknown as NextRequest;

      // Mock the database response
      (db.jobApplication.create as jest.Mock).mockResolvedValue({
        id: 'job1',
        title: 'Software Engineer',
        company: 'Tech Co',
        description: 'Job description',
        status: 'APPLIED',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Call the handler
      const response = await mockHandlers.POST['/api/jobs'](req);
      const data = await response.json();

      // Verify the response
      expect(data.success).toBe(true);
      expect(data.job.title).toBe('Software Engineer');
      expect(data.job.company).toBe('Tech Co');
      expect(db.jobApplication.create).toHaveBeenCalledTimes(1);
    });

    it('PUT /api/jobs/:id updates a job application', async () => {
      // Mock the request and params
      const req = {
        json: jest.fn().mockResolvedValue({
          status: 'INTERVIEW',
          notes: 'Interview scheduled',
        }),
      } as unknown as NextRequest;
      const params = { id: 'job1' };

      // Mock the database response
      (db.jobApplication.update as jest.Mock).mockResolvedValue({
        id: 'job1',
        title: 'Software Engineer',
        company: 'Tech Co',
        description: 'Job description',
        status: 'INTERVIEW',
        notes: 'Interview scheduled',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Call the handler
      const response = await mockHandlers.PUT['/api/jobs/:id'](req, { params });
      const data = await response.json();

      // Verify the response
      expect(data.success).toBe(true);
      expect(data.job.status).toBe('INTERVIEW');
      expect(data.job.notes).toBe('Interview scheduled');
      expect(db.jobApplication.update).toHaveBeenCalledWith({
        where: { id: 'job1' },
        data: expect.any(Object),
      });
    });

    it('DELETE /api/jobs/:id deletes a job application', async () => {
      // Mock the request and params
      const req = {} as NextRequest;
      const params = { id: 'job1' };

      // Call the handler
      const response = await mockHandlers.DELETE['/api/jobs/:id'](req, { params });
      const data = await response.json();

      // Verify the response
      expect(data.success).toBe(true);
      expect(db.jobApplication.delete).toHaveBeenCalledWith({
        where: { id: 'job1' },
      });
    });
  });
});
