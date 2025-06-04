import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAdminRole() {
  try {
    // Update the user with email admin@jobassistant.com to have the ADMIN role
    const updatedUser = await prisma.user.update({
      where: {
        email: 'admin@jobassistant.com',
      },
      data: {
        role: 'ADMIN',
      },
    });

    console.log('Updated user:', updatedUser);
  } catch (error) {
    console.error('Error updating user role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminRole();
