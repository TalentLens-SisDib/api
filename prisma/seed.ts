import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import * as argon2 from "argon2";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaBetterSqlite3({
  url: process.env["DATABASE_URL"]!,
});

const prisma = new PrismaClient({ adapter });

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

const companies = [
  { name: "TalentLens Labs" },
  { name: "Northwind Analytics" },
  { name: "Acme Talent" },
];

const users = [
  {
    email: "admin@talentlens.dev",
    name: "Ada Admin",
    password: "admin123",
    role: "Admin",
    company: "TalentLens Labs",
  },
  {
    email: "recruiter@talentlens.dev",
    name: "Rita Recruiter",
    password: "recruiter123",
    role: "Recruiter",
    company: "TalentLens Labs",
  },
  {
    email: "recruiter@northwind.dev",
    name: "Noor Northwind",
    password: "recruiter123",
    role: "Recruiter",
    company: "Northwind Analytics",
  },
  {
    email: "admin@acme.dev",
    name: "Alan Acme",
    password: "admin123",
    role: "Admin",
    company: "Acme Talent",
  },
] as const;

async function main() {
  const companyIds = new Map<string, number>();

  for (const company of companies) {
    const record = await prisma.company.upsert({
      where: { name: company.name },
      update: {},
      create: company,
    });
    companyIds.set(record.name, record.id);
  }

  for (const user of users) {
    const companyId = companyIds.get(user.company)!;
    const password = await argon2.hash(user.password, ARGON2_OPTIONS);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        password,
        role: user.role,
        companyId,
      },
      create: {
        email: user.email,
        name: user.name,
        password,
        role: user.role,
        companyId,
      },
    });
  }

  const [companyCount, userCount] = await Promise.all([
    prisma.company.count(),
    prisma.user.count(),
  ]);

  console.log(`Seeded ${companyCount} companies and ${userCount} users.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });