
import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { hash } from 'bcryptjs';

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is missing in backend/.env');
  }

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
  });

  try {
    const email = 'doctor1@example.com';

    const passwordHash = await hash('DoctorPass123', 12);

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: 'Dr. Amit Sharma',
        email,
        passwordHash,
        role: 'DOCTOR',
      },
    });

    await prisma.doctorProfile.upsert({
      where: { userId: user.id },
      update: {
        specialization: 'General Physician',
        qualification: 'MBBS, MD',
        consultationFee: 500,
        isAvailable: true,
      },
      create: {
        userId: user.id,
        specialization: 'General Physician',
        qualification: 'MBBS, MD',
        consultationFee: 500,
        isAvailable: true,
      },
    });

    console.log('Test doctor created successfully.');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
