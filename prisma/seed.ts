import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("plateform-demo", 10);

  const tenant = await prisma.tenant.upsert({
    where: { slug: "plateform" },
    update: { name: "Plateform", status: "active", plan: "premium" },
    create: {
      id: "tenant_plateform_demo",
      name: "Plateform",
      slug: "plateform",
      status: "active",
      plan: "premium"
    }
  });

  const restaurant = await prisma.restaurant.upsert({
    where: { id: "restaurant_plateform_demo" },
    update: {
      tenantId: tenant.id,
      name: "Pizzeria Plateform",
      address: "Via Roma 12",
      city: "Milano",
      phone: "+39 02 0000 0000",
      email: "ciao@plateform.it",
      capacity: 40
    },
    create: {
      id: "restaurant_plateform_demo",
      tenantId: tenant.id,
      name: "Pizzeria Plateform",
      address: "Via Roma 12",
      city: "Milano",
      phone: "+39 02 0000 0000",
      email: "ciao@plateform.it",
      capacity: 40
    }
  });

  await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: "admin@plateform.it"
      }
    },
    update: {
      passwordHash,
      role: "owner",
      status: "active",
      restaurantId: restaurant.id
    },
    create: {
      tenantId: tenant.id,
      restaurantId: restaurant.id,
      name: "Admin Plateform",
      email: "admin@plateform.it",
      passwordHash,
      role: "owner",
      status: "active"
    }
  });

  const sala = await prisma.diningArea.upsert({
    where: { id: "area_sala" },
    update: { tenantId: tenant.id, restaurantId: restaurant.id, name: "Sala interna" },
    create: { id: "area_sala", tenantId: tenant.id, restaurantId: restaurant.id, name: "Sala interna", sortOrder: 1 }
  });

  const dehors = await prisma.diningArea.upsert({
    where: { id: "area_dehors" },
    update: { tenantId: tenant.id, restaurantId: restaurant.id, name: "Dehors" },
    create: { id: "area_dehors", tenantId: tenant.id, restaurantId: restaurant.id, name: "Dehors", sortOrder: 2 }
  });

  const tables = [
    ["table_t1", "T1", 1, 2, sala.id, 12, 18],
    ["table_t2", "T2", 1, 2, sala.id, 34, 18],
    ["table_t3", "T3", 2, 4, sala.id, 56, 18],
    ["table_t4", "T4", 2, 4, sala.id, 78, 18],
    ["table_t5", "T5", 2, 4, dehors.id, 18, 56],
    ["table_t6", "T6", 4, 6, dehors.id, 44, 56],
    ["table_t7", "T7", 4, 6, dehors.id, 72, 56]
  ] as const;

  for (const [id, name, seatsMin, seatsMax, diningAreaId, positionX, positionY] of tables) {
    await prisma.restaurantTable.upsert({
      where: { id },
      update: { tenantId: tenant.id, restaurantId: restaurant.id, diningAreaId, name, seatsMin, seatsMax, positionX, positionY },
      create: { id, tenantId: tenant.id, restaurantId: restaurant.id, diningAreaId, name, seatsMin, seatsMax, positionX, positionY }
    });
  }

  const combo = await prisma.tableCombination.upsert({
    where: { id: "combo_t3_t4" },
    update: { tenantId: tenant.id, restaurantId: restaurant.id, name: "T3 + T4", totalSeatsMin: 5, totalSeatsMax: 8 },
    create: {
      id: "combo_t3_t4",
      tenantId: tenant.id,
      restaurantId: restaurant.id,
      name: "T3 + T4",
      totalSeatsMin: 5,
      totalSeatsMax: 8
    }
  });

  await prisma.tableCombinationItem.deleteMany({ where: { combinationId: combo.id } });
  await prisma.tableCombinationItem.createMany({
    data: [
      { combinationId: combo.id, tableId: "table_t3" },
      { combinationId: combo.id, tableId: "table_t4" }
    ],
    skipDuplicates: true
  });

  await prisma.serviceShift.deleteMany({ where: { tenantId: tenant.id, restaurantId: restaurant.id } });
  await prisma.serviceShift.createMany({
    data: [
      {
        tenantId: tenant.id,
        restaurantId: restaurant.id,
        name: "Pranzo",
        startTime: "12:00",
        endTime: "15:00",
        defaultDurationMinutes: 90,
        slotIntervalMinutes: 30
      },
      {
        tenantId: tenant.id,
        restaurantId: restaurant.id,
        name: "Cena",
        startTime: "19:00",
        endTime: "23:30",
        defaultDurationMinutes: 105,
        slotIntervalMinutes: 30
      }
    ]
  });

  await prisma.openingHour.deleteMany({ where: { tenantId: tenant.id, restaurantId: restaurant.id } });
  await prisma.openingHour.createMany({
    data: Array.from({ length: 7 }, (_, dayOfWeek) => ({
      tenantId: tenant.id,
      restaurantId: restaurant.id,
      dayOfWeek,
      openTime: "12:00",
      closeTime: "23:30",
      isClosed: dayOfWeek === 1
    }))
  });

  await prisma.reservationTable.deleteMany({
    where: {
      reservation: {
        tenantId: tenant.id,
        restaurantId: restaurant.id
      }
    }
  });
  await prisma.reservation.deleteMany({ where: { tenantId: tenant.id, restaurantId: restaurant.id } });

  const customer = await prisma.customer.upsert({
    where: {
      tenantId_restaurantId_phone: {
        tenantId: tenant.id,
        restaurantId: restaurant.id,
        phone: "+39 333 123 4567"
      }
    },
    update: { firstName: "Mario Rossi", email: "mario@example.it" },
    create: {
      tenantId: tenant.id,
      restaurantId: restaurant.id,
      firstName: "Mario Rossi",
      phone: "+39 333 123 4567",
      email: "mario@example.it"
    }
  });

  await prisma.reservation.create({
    data: {
      tenantId: tenant.id,
      restaurantId: restaurant.id,
      customerId: customer.id,
      customerName: "Mario Rossi",
      customerPhone: "+39 333 123 4567",
      customerEmail: "mario@example.it",
      partySize: 4,
      reservationDate: new Date("2026-05-07T00:00:00.000Z"),
      startTime: "20:00",
      endTime: "21:45",
      source: "website",
      status: "confirmed",
      tables: {
        create: [{ tableId: "table_t4" }]
      }
    }
  });

  await prisma.supplier.upsert({
    where: { id: "supplier_molino" },
    update: { tenantId: tenant.id, restaurantId: restaurant.id, name: "Molino Nord" },
    create: { id: "supplier_molino", tenantId: tenant.id, restaurantId: restaurant.id, name: "Molino Nord" }
  });

  await prisma.ingredient.upsert({
    where: { id: "ingredient_flour" },
    update: {
      tenantId: tenant.id,
      restaurantId: restaurant.id,
      supplierId: "supplier_molino",
      name: "Farina tipo 0",
      category: "Impasti",
      stock: 48,
      minStock: 20,
      unitCost: 1.15
    },
    create: {
      id: "ingredient_flour",
      tenantId: tenant.id,
      restaurantId: restaurant.id,
      supplierId: "supplier_molino",
      name: "Farina tipo 0",
      category: "Impasti",
      stock: 48,
      minStock: 20,
      unitCost: 1.15
    }
  });

  const category = await prisma.menuCategory.upsert({
    where: { id: "category_classiche" },
    update: { tenantId: tenant.id, restaurantId: restaurant.id, name: "Pizze classiche" },
    create: { id: "category_classiche", tenantId: tenant.id, restaurantId: restaurant.id, name: "Pizze classiche" }
  });

  await prisma.menuItem.upsert({
    where: { id: "menu_margherita" },
    update: { tenantId: tenant.id, restaurantId: restaurant.id, categoryId: category.id, name: "Margherita", price: 8.5 },
    create: {
      id: "menu_margherita",
      tenantId: tenant.id,
      restaurantId: restaurant.id,
      categoryId: category.id,
      name: "Margherita",
      price: 8.5
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
