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
    prisma.ambulanceRequest.deleteMany(),
    prisma.ambulance.deleteMany(),
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
    {
      name: "Anna Nagar Blood Centre",
      email: "annanagar@bloodbank.demo",
      lat: 13.0850,
      lng: 80.2101,
      address: "2nd Avenue, Anna Nagar, Chennai",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600040",
      stock: { O_NEG: 3, O_POS: 10, A_POS: 8, A_NEG: 2, B_POS: 6, B_NEG: 1, AB_POS: 3, AB_NEG: 0 },
    },
    {
      name: "Tambaram Voluntary Blood Bank",
      email: "tambaram@bloodbank.demo",
      lat: 12.9249,
      lng: 80.1000,
      address: "GST Road, Tambaram, Chennai",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600045",
      stock: { O_NEG: 1, O_POS: 6, A_POS: 4, A_NEG: 0, B_POS: 3, B_NEG: 0, AB_POS: 1, AB_NEG: 0 },
    },
    {
      name: "Porur Blood Bank Trust",
      email: "porur@bloodbank.demo",
      lat: 13.0382,
      lng: 80.1565,
      address: "Mount Poonamallee Road, Porur, Chennai",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600116",
      stock: { O_NEG: 5, O_POS: 14, A_POS: 9, A_NEG: 3, B_POS: 8, B_NEG: 2, AB_POS: 4, AB_NEG: 1 },
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

    await prisma.ambulance.create({
      data: {
        organizationId: user.organization!.id,
        vehicleNumber: `TN-AMB-${Math.floor(Math.random() * 9000 + 1000)}`,
        driverName: "Driver on Duty",
        driverPhone: "+91-9876599999",
        lat: bb.lat,
        lng: bb.lng,
      },
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
    {
      name: "Guindy General Hospital",
      email: "guindy@hospital.demo",
      lat: 13.0067,
      lng: 80.2206,
      address: "Sardar Patel Road, Guindy, Chennai",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600032",
    },
    {
      name: "Egmore Children's Hospital",
      email: "egmore@hospital.demo",
      lat: 13.0732,
      lng: 80.2609,
      address: "Pantheon Road, Egmore, Chennai",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600008",
    },
    {
      name: "Vadapalani Health Centre",
      email: "vadapalani@hospital.demo",
      lat: 13.0504,
      lng: 80.2129,
      address: "Arcot Road, Vadapalani, Chennai",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600026",
    },
    {
      name: "Perambur Government Hospital",
      email: "perambur@hospital.demo",
      lat: 13.1106,
      lng: 80.2329,
      address: "Paterson Road, Perambur, Chennai",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600011",
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

    await prisma.ambulance.create({
      data: {
        organizationId: user.organization!.id,
        vehicleNumber: `TN-AMB-${Math.floor(Math.random() * 9000 + 1000)}`,
        driverName: "Driver on Duty",
        driverPhone: "+91-9876522222",
        lat: h.lat,
        lng: h.lng,
      },
    });
  }

  const donorSeeds = [
    { name: "Arun Kumar", group: "O_NEG" as BloodGroup, lat: 13.0500, lng: 80.2600, city: "Chennai", available: true, lastDonationDaysAgo: 120, isSmoker: true },
    { name: "Divya Shree", group: "O_POS" as BloodGroup, lat: 13.0250, lng: 80.2450, city: "Chennai", available: true, lastDonationDaysAgo: null },
    { name: "Karthik Raja", group: "A_POS" as BloodGroup, lat: 13.0700, lng: 80.2750, city: "Chennai", available: true, lastDonationDaysAgo: 30, isAlcoholic: true },
    { name: "Priya Lakshmi", group: "B_POS" as BloodGroup, lat: 12.9900, lng: 80.2200, city: "Chennai", available: true, lastDonationDaysAgo: null },
    {
      name: "Suresh Babu",
      group: "AB_POS" as BloodGroup,
      lat: 13.0050,
      lng: 80.2550,
      city: "Chennai",
      available: false,
      lastDonationDaysAgo: 10,
      hasChronicIllness: true,
      chronicIllnessDetails: "Controlled hypertension, on daily medication",
    },
    { name: "Meena Devi", group: "A_NEG" as BloodGroup, lat: 13.0400, lng: 80.2300, city: "Chennai", available: true, lastDonationDaysAgo: 200 },
    {
      name: "Vignesh Iyer",
      group: "B_NEG" as BloodGroup,
      lat: 13.0150,
      lng: 80.2650,
      city: "Chennai",
      available: true,
      lastDonationDaysAgo: null,
      hasGeneticDisorder: true,
      geneticDisorderDetails: "Mild hemophilia A carrier, monitored by hematologist",
    },
    { name: "Lakshmi Narayanan", group: "O_NEG" as BloodGroup, lat: 12.9950, lng: 80.2250, city: "Chennai", available: true, lastDonationDaysAgo: null },
    { name: "Ramesh Chandran", group: "AB_NEG" as BloodGroup, lat: 13.0600, lng: 80.2500, city: "Chennai", available: true, lastDonationDaysAgo: 95, usesDrugs: false },
    { name: "Saranya Murugan", group: "O_POS" as BloodGroup, lat: 13.0300, lng: 80.2150, city: "Chennai", available: true, lastDonationDaysAgo: 45 },
    { name: "Anitha Raj", group: "B_NEG" as BloodGroup, lat: 13.0850, lng: 80.2101, city: "Chennai", available: true, lastDonationDaysAgo: null },
    { name: "Mohammed Faizal", group: "O_POS" as BloodGroup, lat: 12.9249, lng: 80.1000, city: "Chennai", available: true, lastDonationDaysAgo: 60 },
    { name: "Deepa Venkat", group: "AB_POS" as BloodGroup, lat: 13.0382, lng: 80.1565, city: "Chennai", available: true, lastDonationDaysAgo: null },
    {
      name: "Senthil Kumar",
      group: "A_NEG" as BloodGroup,
      lat: 13.0067,
      lng: 80.2206,
      city: "Chennai",
      available: false,
      lastDonationDaysAgo: 5,
      isAlcoholic: true,
    },
    { name: "Revathi Subramani", group: "O_NEG" as BloodGroup, lat: 13.0732, lng: 80.2609, city: "Chennai", available: true, lastDonationDaysAgo: 150 },
    { name: "Bharath Krishnan", group: "B_POS" as BloodGroup, lat: 13.0504, lng: 80.2129, city: "Chennai", available: true, lastDonationDaysAgo: null },
    {
      name: "Yamuna Selvi",
      group: "A_POS" as BloodGroup,
      lat: 13.1106,
      lng: 80.2329,
      city: "Chennai",
      available: true,
      lastDonationDaysAgo: 75,
      hasChronicIllness: true,
      chronicIllnessDetails: "Type 2 diabetes, diet-controlled",
    },
    { name: "Gokul Anand", group: "AB_NEG" as BloodGroup, lat: 13.0600, lng: 80.2700, city: "Chennai", available: true, lastDonationDaysAgo: null },
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
            isSmoker: d.isSmoker ?? false,
            isAlcoholic: d.isAlcoholic ?? false,
            usesDrugs: d.usesDrugs ?? false,
            hasChronicIllness: d.hasChronicIllness ?? false,
            chronicIllnessDetails: d.chronicIllnessDetails,
            hasGeneticDisorder: d.hasGeneticDisorder ?? false,
            geneticDisorderDetails: d.geneticDisorderDetails,
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
  console.log(
    "Blood bank logins: central@bloodbank.demo, adyar@bloodbank.demo, velachery@bloodbank.demo, annanagar@bloodbank.demo, tambaram@bloodbank.demo, porur@bloodbank.demo",
  );
  console.log(
    "Hospital logins: mylapore@hospital.demo, tnagar@hospital.demo, guindy@hospital.demo, egmore@hospital.demo, vadapalani@hospital.demo, perambur@hospital.demo",
  );
  console.log(`Donor logins: donor1@demo.com ... donor${donorSeeds.length}@demo.com`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
