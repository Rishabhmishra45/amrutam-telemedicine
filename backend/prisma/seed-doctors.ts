
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomUUID } from "node:crypto";

const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL is missing from backend/.env");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const doctors = [
  {
    name: "Dr. Aarav Sharma",
    email: "aarav.sharma.demo@example.com",
    specialization: "General Physician",
    qualification: "MBBS, MD",
    consultationFee: 500,
    imageUrl: "https://i.pravatar.cc/300?img=12",
  },
  {
    name: "Dr. Ananya Verma",
    email: "ananya.verma.demo@example.com",
    specialization: "Cardiologist",
    qualification: "MBBS, DM",
    consultationFee: 800,
    imageUrl: "https://i.pravatar.cc/300?img=47",
  },
  {
    name: "Dr. Rohan Mehta",
    email: "rohan.mehta.demo@example.com",
    specialization: "Dermatologist",
    qualification: "MBBS, MD",
    consultationFee: 600,
    imageUrl: "https://i.pravatar.cc/300?img=13",
  },
  {
    name: "Dr. Priya Singh",
    email: "priya.singh.demo@example.com",
    specialization: "Pediatrician",
    qualification: "MBBS, MD",
    consultationFee: 550,
    imageUrl: "https://i.pravatar.cc/300?img=44",
  },
  {
    name: "Dr. Vikram Patel",
    email: "vikram.patel.demo@example.com",
    specialization: "Orthopedic",
    qualification: "MBBS, MS",
    consultationFee: 700,
    imageUrl: "https://i.pravatar.cc/300?img=14",
  },
  {
    name: "Dr. Neha Gupta",
    email: "neha.gupta.demo@example.com",
    specialization: "Gynecologist",
    qualification: "MBBS, MS",
    consultationFee: 650,
    imageUrl: "https://i.pravatar.cc/300?img=45",
  },
  {
    name: "Dr. Aditya Rao",
    email: "aditya.rao.demo@example.com",
    specialization: "Neurologist",
    qualification: "MBBS, DM",
    consultationFee: 900,
    imageUrl: "https://i.pravatar.cc/300?img=15",
  },
  {
    name: "Dr. Kavya Joshi",
    email: "kavya.joshi.demo@example.com",
    specialization: "Psychiatrist",
    qualification: "MBBS, MD",
    consultationFee: 750,
    imageUrl: "https://i.pravatar.cc/300?img=46",
  },
  {
    name: "Dr. Karan Malhotra",
    email: "karan.malhotra.demo@example.com",
    specialization: "ENT Specialist",
    qualification: "MBBS, MS",
    consultationFee: 600,
    imageUrl: "https://i.pravatar.cc/300?img=16",
  },
  {
    name: "Dr. Isha Kapoor",
    email: "isha.kapoor.demo@example.com",
    specialization: "Endocrinologist",
    qualification: "MBBS, DM",
    consultationFee: 850,
    imageUrl: "https://i.pravatar.cc/300?img=48",
  },
];

async function main() {
  for (const doctor of doctors) {
    await prisma.user.upsert({
      where: { email: doctor.email },
      update: {
        name: doctor.name,
        role: "DOCTOR",
        doctor: {
          upsert: {
            create: {
              specialization: doctor.specialization,
              qualification: doctor.qualification,
              consultationFee: doctor.consultationFee,
              isAvailable: true,
            },
            update: {
              specialization: doctor.specialization,
              qualification: doctor.qualification,
              consultationFee: doctor.consultationFee,
              isAvailable: true,
            },
          },
        },
      },
      create: {
        name: doctor.name,
        email: doctor.email,
        passwordHash: randomUUID(),
        role: "DOCTOR",
        doctor: {
          create: {
            specialization: doctor.specialization,
            qualification: doctor.qualification,
            consultationFee: doctor.consultationFee,
            isAvailable: true,
          },
        },
      },
    });

    console.log(`Seeded: ${doctor.name} | ${doctor.imageUrl}`);
  }
}

main()
  .catch((error) => {
    console.error("Doctor seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
