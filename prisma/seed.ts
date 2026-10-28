import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";

async function main() {
  // The seed wipes every table first; never run it against production data.
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed: NODE_ENV is production.");
  }

  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.bookingEvent.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.review.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.commissionRecord.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.technicianAvailability.deleteMany();
  await prisma.technicianServiceArea.deleteMany();
  await prisma.technicianService.deleteMany();
  await prisma.technicianVerificationDocument.deleteMany();
  await prisma.technicianProfile.deleteMany();
  await prisma.adminAuditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.serviceArea.deleteMany();

  const categories = await Promise.all([
    prisma.serviceCategory.create({
      data: {
        name: "Electrician",
        slug: "electrician",
        description: "Home wiring, repairs, and installations",
        iconKey: "zap",
        sortOrder: 1,
        indicativeMin: 299,
        indicativeMax: 2500,
      },
    }),
    prisma.serviceCategory.create({
      data: {
        name: "AC repair",
        slug: "ac-repair",
        description: "Servicing, gas refill, and breakdown fixes",
        iconKey: "snowflake",
        sortOrder: 2,
        indicativeMin: 399,
        indicativeMax: 3500,
      },
    }),
    prisma.serviceCategory.create({
      data: {
        name: "Plumbing",
        slug: "plumbing",
        description: "Leaks, blockages, and fittings",
        iconKey: "droplets",
        sortOrder: 3,
        indicativeMin: 249,
        indicativeMax: 2000,
      },
    }),
  ]);

  const areas = await Promise.all([
    prisma.serviceArea.create({
      data: { city: "Hyderabad", locality: "Madhapur", pincode: "500081" },
    }),
    prisma.serviceArea.create({
      data: { city: "Hyderabad", locality: "Kukatpally", pincode: "500072" },
    }),
    prisma.serviceArea.create({
      data: { city: "Hyderabad", locality: "Gachibowli", pincode: "500032" },
    }),
    prisma.serviceArea.create({
      data: { city: "Hyderabad", locality: "Secunderabad", pincode: "500003" },
    }),
  ]);

  const admin = await prisma.user.create({
    data: {
      name: "FixNear Admin",
      email: "admin@fixnear.in",
      phone: "+919876543210",
      passwordHash,
      role: "ADMIN",
      accountStatus: "ACTIVE",
    },
  });

  await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "customer@example.com",
      phone: "+919888877766",
      passwordHash,
      role: "CUSTOMER",
      accountStatus: "ACTIVE",
    },
  });

  const techUsers = await Promise.all([
    prisma.user.create({
      data: {
        name: "Ravi Kumar",
        email: "ravi.electric@example.com",
        phone: "+919777766655",
        passwordHash,
        role: "TECHNICIAN",
        accountStatus: "ACTIVE",
      },
    }),
    prisma.user.create({
      data: {
        name: "Anil Reddy",
        email: "anil.ac@example.com",
        phone: "+919666655544",
        passwordHash,
        role: "TECHNICIAN",
        accountStatus: "ACTIVE",
      },
    }),
    prisma.user.create({
      data: {
        name: "Suresh Rao",
        email: "suresh.plumb@example.com",
        phone: "+919555544433",
        passwordHash,
        role: "TECHNICIAN",
        accountStatus: "ACTIVE",
      },
    }),
    prisma.user.create({
      data: {
        name: "New Applicant",
        email: "pending.tech@example.com",
        phone: "+919444433322",
        passwordHash,
        role: "TECHNICIAN",
        accountStatus: "PENDING",
      },
    }),
  ]);

  const profiles = await Promise.all([
    prisma.technicianProfile.create({
      data: {
        userId: techUsers[0].id,
        bio: "Licensed electrician with 8 years experience in Hyderabad apartments.",
        experienceYears: 8,
        verificationStatus: "APPROVED",
        applicationStatus: "APPROVED",
        isVerified: true,
        approvedAt: new Date(),
        approvedById: admin.id,
        ratingAverage: 4.8,
        ratingCount: 12,
      },
    }),
    prisma.technicianProfile.create({
      data: {
        userId: techUsers[1].id,
        bio: "AC specialist for split and window units.",
        experienceYears: 6,
        verificationStatus: "APPROVED",
        applicationStatus: "APPROVED",
        isVerified: true,
        approvedAt: new Date(),
        approvedById: admin.id,
        ratingAverage: 4.6,
        ratingCount: 9,
      },
    }),
    prisma.technicianProfile.create({
      data: {
        userId: techUsers[2].id,
        bio: "Plumber covering Madhapur and Gachibowli.",
        experienceYears: 5,
        verificationStatus: "APPROVED",
        applicationStatus: "APPROVED",
        isVerified: true,
        approvedAt: new Date(),
        approvedById: admin.id,
        ratingAverage: 4.7,
        ratingCount: 7,
      },
    }),
    prisma.technicianProfile.create({
      data: {
        userId: techUsers[3].id,
        bio: "Awaiting document verification.",
        experienceYears: 2,
        verificationStatus: "PENDING",
        applicationStatus: "PENDING",
      },
    }),
  ]);

  await prisma.technicianService.createMany({
    data: [
      { technicianId: profiles[0].id, categoryId: categories[0].id, visitFee: 199, labourMin: 300, labourMax: 2000 },
      { technicianId: profiles[1].id, categoryId: categories[1].id, visitFee: 249, labourMin: 400, labourMax: 3000 },
      { technicianId: profiles[2].id, categoryId: categories[2].id, visitFee: 179, labourMin: 250, labourMax: 1800 },
    ],
  });

  await prisma.technicianServiceArea.createMany({
    data: [
      { technicianId: profiles[0].id, areaId: areas[0].id },
      { technicianId: profiles[0].id, areaId: areas[2].id },
      { technicianId: profiles[1].id, areaId: areas[1].id },
      { technicianId: profiles[1].id, areaId: areas[2].id },
      { technicianId: profiles[2].id, areaId: areas[0].id },
      { technicianId: profiles[2].id, areaId: areas[2].id },
    ],
  });

  await prisma.technicianAvailability.createMany({
    // Approved technicians work Monday to Saturday.
    data: profiles.slice(0, 3).flatMap((profile) =>
      [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        technicianId: profile.id,
        dayOfWeek,
        startTime: "09:00",
        endTime: "18:00",
      }))
    ),
  });

  console.log("Seed complete.");
  console.log("Admin: admin@fixnear.in / password123");
  console.log("Customer: customer@example.com / password123");
  console.log("Technicians: ravi.electric@example.com, anil.ac@example.com, suresh.plumb@example.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
