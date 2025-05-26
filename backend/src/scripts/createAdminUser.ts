import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as readline from 'readline';
import { stdin as input, stdout as output } from 'process';

// Initialize Prisma client
const prisma = new PrismaClient();

// Terminal interface
const rl = readline.createInterface({ input, output });

// Simple ask question function
const ask = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(`${question}: `, (answer) => {
      resolve(answer);
    });
  });
};

// Main function
async function createAdmin() {
  console.log('\n=== CREAR USUARIO ADMINISTRADOR ===\n');
  
  try {
    // Get username and password only
    const username = await ask('Username');
    const password = await ask('Password');

    // Basic validation
    if (!username || !password) {
      console.error('❌ Error: Username y password son obligatorios');
      return;
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      console.error(`❌ Error: El usuario "${username}" ya existe`);
      return;
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash: hashedPassword,
        email: `${username}@agricoventas.com`,
        firstName: 'Admin',
        lastName: 'User',
        userType: 'ADMIN',
        isActive: true
      }
    });

    console.log('\n✅ Admin creado exitosamente:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log('\nPuede iniciar sesión con estas credenciales.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Run the script
createAdmin(); 