import { BloodGroup, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const DEMO_PASSWORD = "Password123!";

const ALL_GROUPS: BloodGroup[] = ["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"];

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

export async function seedDatabase(prisma: PrismaClient) {
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
      lng: 80.218,
      address: "100 Feet Road, Velachery, Chennai",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600042",
      stock: { O_NEG: 2, O_POS: 0, A_POS: 0, A_NEG: 1, B_POS: 4, B_NEG: 0, AB_POS: 0, AB_NEG: 0 },
    },
    {
      name: "Anna Nagar Blood Centre",
      email: "annanagar@bloodbank.demo",
      lat: 13.085,
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
      lng: 80.1,
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
    { name: "Arun Kumar", group: "O_NEG" as BloodGroup, lat: 13.05, lng: 80.26, city: "Chennai", available: true, lastDonationDaysAgo: 120, isSmoker: true },
    { name: "Divya Shree", group: "O_POS" as BloodGroup, lat: 13.025, lng: 80.245, city: "Chennai", available: true, lastDonationDaysAgo: null },
    { name: "Karthik Raja", group: "A_POS" as BloodGroup, lat: 13.07, lng: 80.275, city: "Chennai", available: true, lastDonationDaysAgo: 30, isAlcoholic: true },
    { name: "Priya Lakshmi", group: "B_POS" as BloodGroup, lat: 12.99, lng: 80.22, city: "Chennai", available: true, lastDonationDaysAgo: null },
    {
      name: "Suresh Babu",
      group: "AB_POS" as BloodGroup,
      lat: 13.005,
      lng: 80.255,
      city: "Chennai",
      available: false,
      lastDonationDaysAgo: 10,
      hasChronicIllness: true,
      chronicIllnessDetails: "Controlled hypertension, on daily medication",
    },
    { name: "Meena Devi", group: "A_NEG" as BloodGroup, lat: 13.04, lng: 80.23, city: "Chennai", available: true, lastDonationDaysAgo: 200 },
    {
      name: "Vignesh Iyer",
      group: "B_NEG" as BloodGroup,
      lat: 13.015,
      lng: 80.265,
      city: "Chennai",
      available: true,
      lastDonationDaysAgo: null,
      hasGeneticDisorder: true,
      geneticDisorderDetails: "Mild hemophilia A carrier, monitored by hematologist",
    },
    { name: "Lakshmi Narayanan", group: "O_NEG" as BloodGroup, lat: 12.995, lng: 80.225, city: "Chennai", available: true, lastDonationDaysAgo: null },
    { name: "Ramesh Chandran", group: "AB_NEG" as BloodGroup, lat: 13.06, lng: 80.25, city: "Chennai", available: true, lastDonationDaysAgo: 95, usesDrugs: false },
    { name: "Saranya Murugan", group: "O_POS" as BloodGroup, lat: 13.03, lng: 80.215, city: "Chennai", available: true, lastDonationDaysAgo: 45 },
    { name: "Anitha Raj", group: "B_NEG" as BloodGroup, lat: 13.085, lng: 80.2101, city: "Chennai", available: true, lastDonationDaysAgo: null },
    { name: "Mohammed Faizal", group: "O_POS" as BloodGroup, lat: 12.9249, lng: 80.1, city: "Chennai", available: true, lastDonationDaysAgo: 60 },
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
    { name: "Gokul Anand", group: "AB_NEG" as BloodGroup, lat: 13.06, lng: 80.27, city: "Chennai", available: true, lastDonationDaysAgo: null },
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

  const requestSeeds = [
    {
      org: hospitals[0],
      bloodGroup: "O_NEG" as BloodGroup,
      unitsNeeded: 3,
      urgency: "CRITICAL" as const,
      patientInfo: "Road traffic accident victim, emergency surgery in progress",
      notes: "Please call ahead, ICU ward 4th floor",
      hoursToExpire: 12,
    },
    {
      org: hospitals[1],
      bloodGroup: "A_POS" as BloodGroup,
      unitsNeeded: 2,
      urgency: "HIGH" as const,
      patientInfo: "Scheduled cardiac bypass surgery tomorrow morning",
      notes: "Donors can drop off at the blood bank counter, ground floor",
      hoursToExpire: 36,
    },
    {
      org: hospitals[2],
      bloodGroup: "B_POS" as BloodGroup,
      unitsNeeded: 4,
      urgency: "MODERATE" as const,
      patientInfo: "Elective surgery patient, building up reserve units ahead of schedule",
      notes: "Any time before Friday works",
      hoursToExpire: 72,
    },
    {
      org: hospitals[3],
      bloodGroup: "O_POS" as BloodGroup,
      unitsNeeded: 2,
      urgency: "HIGH" as const,
      patientInfo: "Postpartum hemorrhage, successfully resolved",
      notes: "Resolved - thank you to our donors",
      hoursToExpire: -48,
      status: "FULFILLED" as const,
      unitsFulfilled: 2,
    },
    {
      org: hospitals[4],
      bloodGroup: "A_NEG" as BloodGroup,
      unitsNeeded: 1,
      urgency: "MODERATE" as const,
      patientInfo: "Planned transfusion for anemia treatment, successfully completed",
      notes: "Resolved",
      hoursToExpire: -120,
      status: "FULFILLED" as const,
      unitsFulfilled: 1,
    },
  ];

  const createdRequests = [];
  for (const r of requestSeeds) {
    const req = await prisma.emergencyRequest.create({
      data: {
        organizationId: r.org.organization!.id,
        bloodGroup: r.bloodGroup,
        unitsNeeded: r.unitsNeeded,
        urgency: r.urgency,
        patientInfo: r.patientInfo,
        notes: r.notes,
        lat: r.org.organization!.lat,
        lng: r.org.organization!.lng,
        address: r.org.organization!.address,
        expiresAt: new Date(Date.now() + r.hoursToExpire * 60 * 60 * 1000),
        ...(r.status ? { status: r.status } : {}),
        ...(r.unitsFulfilled !== undefined ? { unitsFulfilled: r.unitsFulfilled } : {}),
      },
    });
    createdRequests.push(req);
  }

  const oNegDonor = donorUsers.find((u) => u.donorProfile?.bloodGroup === "O_NEG");
  if (oNegDonor) {
    await prisma.requestResponse.create({
      data: {
        requestId: createdRequests[0].id,
        donorUserId: oNegDonor.id,
        status: "OFFERED",
        distanceKm: 3.2,
      },
    });
  }

  const aPosDonor = donorUsers.find((u) => u.donorProfile?.bloodGroup === "A_POS");
  if (aPosDonor) {
    await prisma.requestResponse.create({
      data: {
        requestId: createdRequests[1].id,
        donorUserId: aPosDonor.id,
        status: "CONFIRMED",
        distanceKm: 5.6,
      },
    });
  }

  const oPosCompatibleDonors = donorUsers.filter(
    (u) => u.donorProfile?.bloodGroup === "O_POS" || u.donorProfile?.bloodGroup === "O_NEG",
  );
  for (const donor of oPosCompatibleDonors.slice(0, 2)) {
    await prisma.requestResponse.create({
      data: {
        requestId: createdRequests[3].id,
        donorUserId: donor.id,
        status: "COMPLETED",
        distanceKm: 4.1,
      },
    });
  }

  const aNegCompatibleDonor = donorUsers.find(
    (u) =>
      (u.donorProfile?.bloodGroup === "A_NEG" || u.donorProfile?.bloodGroup === "O_NEG") &&
      !oPosCompatibleDonors.slice(0, 2).some((d) => d.id === u.id),
  );
  if (aNegCompatibleDonor) {
    await prisma.requestResponse.create({
      data: {
        requestId: createdRequests[4].id,
        donorUserId: aNegCompatibleDonor.id,
        status: "COMPLETED",
        distanceKm: 2.7,
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

  return {
    bloodBanks: bloodBankSeeds.length,
    hospitals: hospitalSeeds.length,
    donors: donorSeeds.length,
    requests: requestSeeds.length,
  };
}
