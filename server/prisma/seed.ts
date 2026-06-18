import "dotenv/config";
import { BloodGroup, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Password123!";

const ALL_GROUPS: BloodGroup[] = ["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"];

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("Seeding database...");

  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.requestResponse.deleteMany(),
    prisma.emergencyRequest.deleteMany(),
    prisma.inventoryItem.deleteMany(),
    prisma.donorProfile.deleteMany(),
    prisma.organization.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const passwordHash = await hash(DEMO_PASSWORD);

  await prisma.user.create({
    data: {
      email: "admin@bloodbankfinder.org",
      passwordHash,
      phone: "+91-9000000000",
      role: "ADMIN",
    },
  });

  const bloodBankSeeds = [
    {
      name: "Chennai Central Blood Bank",
      email: "central@bloodbank.demo",
      lat: 13.0827,
      lng: 80.2707,
      address: "Anna Salai, Chennai",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600002",
      stock: { O_NEG: 4, O_POS: 18, A_POS: 12, A_NEG: 2, B_POS: 15, B_NEG: 3, AB_POS: 6, AB_NEG: 1 },
    },
    {
      name: "Lifeline Blood Bank, Adyar",
      email: "adyar@bloodbank.demo",
      lat: 13.0067,
      lng: 80.2572,
      address: "Lattice Bridge Road, Adyar, Chennai",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600020",
      stock: { O_NEG: 0, O_POS: 5, A_POS: 9, A_NEG: 0, B_POS: 7, B_NEG: 1, AB_POS: 2, AB_NEG: 0 },
    },
    {
      name: "Velachery Community Blood Bank",
      email: "velachery@bloodbank.demo",
      lat: 12.9815,
      lng: 80.2180,
      address: "100 Feet Road, Velachery, Chennai",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600042",
      stock: { O_NEG: 2, O_POS: 0, A_POS: 0, A_NEG: 1, B_POS: 4, B_NEG: 0, AB_POS: 0, AB_NEG: 0 },
    },
  ];

  for (const bb of bloodBankSeeds) {
    const user = await prisma.user.create({
      data: {
        email: bb.email,
        passwordHash,
        phone: "+91-9876500000",
        role: "BLOOD_BANK",
        organization: {
          create: {
            name: bb.name,
            type: "BLOOD_BANK",
            regNumber: `BB-${Math.floor(Math.random() * 90000 + 10000)}`,
            contactPerson: "Duty Officer",
            lat: bb.lat,
            lng: bb.lng,
            address: bb.address,
            city: bb.city,
            state: bb.state,
            pincode: bb.pincode,
            isVerified: true,
          },
        },
      },
      include: { organization: true },
    });

    await prisma.inventoryItem.createMany({
      data: ALL_GROUPS.map((bloodGroup) => ({
        organizationId: user.organization!.id,
        bloodGroup,
        units: bb.stock[bloodGroup],
      })),
    });
  }

  const hospitalSeeds = [
    {
      name: "Mylapore Multispecialty Hospital",
      email: "mylapore@hospital.demo",
      lat: 13.0339,
      lng: 80.2619,
      address: "R K Mutt Road, Mylapore, Chennai",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600004",
    },
    {
      name: "T Nagar General Hospital",
      email: "tnagar@hospital.demo",
      lat: 13.0418,
      lng: 80.2341,
      address: "Usman Road, T Nagar, Chennai",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600017",
    },
  ];

  const hospitals = [];
  for (const h of hospitalSeeds) {
    const user = await prisma.user.create({
      data: {
        email: h.email,
        passwordHash,
        phone: "+91-9876511111",
        role: "HOSPITAL",
        organization: {
          create: {
            name: h.name,
            type: "HOSPITAL",
            regNumber: `HOSP-${Math.floor(Math.random() * 90000 + 10000)}`,
            contactPerson: "Front Desk",
            lat: h.lat,
            lng: h.lng,
            address: h.address,
            city: h.city,
            state: h.state,
            pincode: h.pincode,
            isVerified: true,
          },
        },
      },
      include: { organization: true },
    });
    hospitals.push(user);
  }

  const donorSeeds = [
    { name: "Arun Kumar", group: "O_NEG" as BloodGroup, lat: 13.0500, lng: 80.2600, city: "Chennai", available: true, lastDonationDaysAgo: 120 },
    { name: "Divya Shree", group: "O_POS" as BloodGroup, lat: 13.0250, lng: 80.2450, city: "Chennai", available: true, lastDonationDaysAgo: null },
    { name: "Karthik Raja", group: "A_POS" as BloodGroup, lat: 13.0700, lng: 80.2750, city: "Chennai", available: true, lastDonationDaysAgo: 30 },
    { name: "Priya Lakshmi", group: "B_POS" as BloodGroup, lat: 12.9900, lng: 80.2200, city: "Chennai", available: true, lastDonationDaysAgo: null },
    { name: "Suresh Babu", group: "AB_POS" as BloodGroup, lat: 13.0050, lng: 80.2550, city: "Chennai", available: false, lastDonationDaysAgo: 10 },
    { name: "Meena Devi", group: "A_NEG" as BloodGroup, lat: 13.0400, lng: 80.2300, city: "Chennai", available: true, lastDonationDaysAgo: 200 },
    { name: "Vignesh Iyer", group: "B_NEG" as BloodGroup, lat: 13.0150, lng: 80.2650, city: "Chennai", available: true, lastDonationDaysAgo: null },
    { name: "Lakshmi Narayanan", group: "O_NEG" as BloodGroup, lat: 12.9950, lng: 80.2250, city: "Chennai", available: true, lastDonationDaysAgo: null },
    { name: "Ramesh Chandran", group: "AB_NEG" as BloodGroup, lat: 13.0600, lng: 80.2500, city: "Chennai", available: true, lastDonationDaysAgo: 95 },
    { name: "Saranya Murugan", group: "O_POS" as BloodGroup, lat: 13.0300, lng: 80.2150, city: "Chennai", available: true, lastDonationDaysAgo: 45 },
  ];

  const donorUsers = [];
  for (let i = 0; i < donorSeeds.length; i++) {
    const d = donorSeeds[i];
    const user = await prisma.user.create({
      data: {
        email: `donor${i + 1}@demo.com`,
        passwordHash,
        phone: `+91-90000${String(i + 1).padStart(5, "0")}`,
        role: "DONOR",
        donorProfile: {
          create: {
            fullName: d.name,
            bloodGroup: d.group,
            gender: i % 2 === 0 ? "MALE" : "FEMALE",
            dateOfBirth: new Date(1985 + (i % 15), i % 12, (i % 27) + 1),
            weightKg: 55 + (i % 6) * 5,
            lat: d.lat,
            lng: d.lng,
            address: `${10 + i} Demo Street`,
            city: d.city,
            state: "Tamil Nadu",
            pincode: "600001",
            isAvailable: d.available,
            lastDonationDate: d.lastDonationDaysAgo
              ? new Date(Date.now() - d.lastDonationDaysAgo * 24 * 60 * 60 * 1000)
              : null,
            totalDonations: d.lastDonationDaysAgo ? Math.ceil(d.lastDonationDaysAgo / 90) : 0,
          },
        },
      },
      include: { donorProfile: true },
    });
    donorUsers.push(user);
  }

  const sampleRequest = await prisma.emergencyRequest.create({
    data: {
      organizationId: hospitals[0].organization!.id,
      bloodGroup: "O_NEG",
      unitsNeeded: 3,
      urgency: "CRITICAL",
      patientInfo: "Road traffic accident victim, emergency surgery in progress",
      notes: "Please call ahead, ICU ward 4th floor",
      lat: hospitals[0].organization!.lat,
      lng: hospitals[0].organization!.lng,
      address: hospitals[0].organization!.address,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    },
  });

  const oNegDonor = donorUsers.find((u) => u.donorProfile?.bloodGroup === "O_NEG");
  if (oNegDonor) {
    await prisma.requestResponse.create({
      data: {
        requestId: sampleRequest.id,
        donorUserId: oNegDonor.id,
        status: "OFFERED",
        distanceKm: 3.2,
      },
    });
  }

  console.log("Seed complete.");
  console.log(`All demo accounts use password: ${DEMO_PASSWORD}`);
  console.log("Admin login: admin@bloodbankfinder.org");
  console.log("Blood bank logins: central@bloodbank.demo, adyar@bloodbank.demo, velachery@bloodbank.demo");
  console.log("Hospital logins: mylapore@hospital.demo, tnagar@hospital.demo");
  console.log("Donor logins: donor1@demo.com ... donor10@demo.com");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
