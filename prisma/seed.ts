import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create admin user
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const passwordHash = await hash(adminPassword, 12);
    
    // Create default experience and education JSON objects
    const defaultExperience = JSON.stringify([
      {
        company: 'Job Assistant',
        position: 'Administrator',
        startDate: '2023-01-01',
        endDate: null,
        description: 'System administrator for the Job Assistant application.'
      }
    ]);
    
    const defaultEducation = JSON.stringify([
      {
        institution: 'Admin University',
        degree: 'System Administration',
        field: 'Computer Science',
        startDate: '2018-01-01',
        endDate: '2022-01-01'
      }
    ]);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@jobassistant.com' },
      update: {
        role: 'ADMIN',
        passwordHash,
      },
      create: {
        email: 'admin@jobassistant.com',
        name: 'Admin User',
        role: 'ADMIN',
        passwordHash,
        experience: defaultExperience,
        education: defaultEducation,
        skills: ['Administration', 'System Management', 'User Support'],
      },
    });
    
    console.log(`Admin user created/updated: ${admin.name} (${admin.email})`);
    console.log(`Password: ${adminPassword === 'admin123' ? 'admin123 (default)' : 'custom password from env'}`);
    console.log('You can now log in with these credentials to access the admin panel.');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
