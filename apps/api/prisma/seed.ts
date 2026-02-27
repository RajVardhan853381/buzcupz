import { PrismaClient, UserRole, TableStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...\n');

    // ============================================
    // 1. CREATE RESTAURANT
    // ============================================
    console.log('Creating restaurant...');

    const restaurant = await prisma.restaurant.upsert({
        where: { slug: 'demo-restaurant' },
        update: {},
        create: {
            name: 'Demo Restaurant',
            slug: 'demo-restaurant',
            description: 'A demo restaurant for testing',
            email: 'contact@demorestaurant.com',
            phone: '+1 (555) 123-4567',
            address: '123 Main Street',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US',
            timezone: 'America/New_York',
            currency: 'USD',
            taxRate: 8.875, // NYC tax rate
            isActive: true,
        },
    });

    console.log(`✅ Restaurant created: ${restaurant.name} (ID: ${restaurant.id})\n`);

    // ============================================
    // 2. CREATE ADMIN USER
    // ============================================
    console.log('Creating admin user...');

    const adminPassword = await bcrypt.hash('Admin@123', 10);

    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@demo.com' },
        update: {},
        create: {
            email: 'admin@demo.com',
            passwordHash: adminPassword,
            firstName: 'Admin',
            lastName: 'User',
            phone: '+1 (555) 000-0001',
            role: UserRole.ADMIN,
            isActive: true,
            isEmailVerified: true,
            restaurantId: restaurant.id,
        },
    });

    console.log(`✅ Admin user created: ${adminUser.email}\n`);

    // ============================================
    // 3. CREATE STAFF USERS
    // ============================================
    console.log('Creating staff users...');

    const staffPassword = await bcrypt.hash('Staff@123', 10);

    const staffUsers = [
        { email: 'manager@demo.com', firstName: 'John', lastName: 'Manager', role: UserRole.MANAGER },
        { email: 'waiter@demo.com', firstName: 'Jane', lastName: 'Waiter', role: UserRole.STAFF },
        { email: 'kitchen@demo.com', firstName: 'Chef', lastName: 'Kitchen', role: UserRole.KITCHEN },
    ];

    for (const staff of staffUsers) {
        await prisma.user.upsert({
            where: { email: staff.email },
            update: {},
            create: {
                ...staff,
                passwordHash: staffPassword,
                isActive: true,
                isEmailVerified: true,
                restaurantId: restaurant.id,
            },
        });
        console.log(`  ✅ Created: ${staff.email} (${staff.role})`);
    }
    console.log('');

    // ============================================
    // 4. CREATE FLOOR PLAN & TABLES
    // ============================================
    console.log('Creating floor plan and tables...');

    const floorPlan = await prisma.floorPlan.upsert({
        where: {
            restaurantId_name: { restaurantId: restaurant.id, name: 'Main Floor' }
        },
        update: {},
        create: {
            name: 'Main Floor',
            description: 'Main dining area',
            width: 1200,
            height: 800,
            isActive: true,
            restaurantId: restaurant.id,
        },
    });

    const tables = [
        { number: 'T1', minCapacity: 1, maxCapacity: 2, positionX: 50, positionY: 50, shape: 'square' },
        { number: 'T2', minCapacity: 1, maxCapacity: 2, positionX: 150, positionY: 50, shape: 'square' },
        { number: 'T3', minCapacity: 2, maxCapacity: 4, positionX: 50, positionY: 150, shape: 'rectangle' },
        { number: 'T4', minCapacity: 2, maxCapacity: 4, positionX: 200, positionY: 150, shape: 'rectangle' },
        { number: 'T5', minCapacity: 4, maxCapacity: 6, positionX: 350, positionY: 100, shape: 'rectangle' },
        { number: 'T6', minCapacity: 4, maxCapacity: 6, positionX: 350, positionY: 250, shape: 'rectangle' },
        { number: 'T7', minCapacity: 6, maxCapacity: 8, positionX: 500, positionY: 150, shape: 'circle' },
        { number: 'T8', minCapacity: 8, maxCapacity: 12, positionX: 650, positionY: 150, shape: 'rectangle', width: 120 },
    ];

    for (const table of tables) {
        await prisma.table.upsert({
            where: {
                restaurantId_number: { restaurantId: restaurant.id, number: table.number }
            },
            update: {},
            create: {
                ...table,
                width: table.width || 80,
                height: 80,
                status: TableStatus.AVAILABLE,
                floorPlanId: floorPlan.id,
                restaurantId: restaurant.id,
            },
        });
    }
    console.log(`✅ Created ${tables.length} tables\n`);

    // ============================================
    // 5. CREATE MENU CATEGORIES
    // ============================================
    console.log('Creating menu categories...');

    const categories = [
        { name: 'Appetizers', description: 'Start your meal right', sortOrder: 1 },
        { name: 'Main Courses', description: 'Hearty main dishes', sortOrder: 2 },
        { name: 'Pizzas', description: 'Fresh from our wood-fired oven', sortOrder: 3 },
        { name: 'Burgers', description: 'Handcrafted burgers', sortOrder: 4 },
        { name: 'Sides', description: 'Perfect accompaniments', sortOrder: 5 },
        { name: 'Desserts', description: 'Sweet endings', sortOrder: 6 },
        { name: 'Beverages', description: 'Drinks and refreshments', sortOrder: 7 },
    ];

    const createdCategories: Record<string, string> = {};

    for (const cat of categories) {
        const category = await prisma.category.upsert({
            where: {
                restaurantId_name: { restaurantId: restaurant.id, name: cat.name }
            },
            update: {},
            create: {
                ...cat,
                isActive: true,
                restaurantId: restaurant.id,
            },
        });
        createdCategories[cat.name] = category.id;
    }
    console.log(`✅ Created ${categories.length} categories\n`);

    // ============================================
    // 6. CREATE MENU ITEMS
    // ============================================
    console.log('Creating menu items...');

    const menuItems = [
        // Appetizers
        { name: 'Caesar Salad', price: 12.99, costPrice: 3.50, category: 'Appetizers', prepTime: 8, isVegetarian: true },
        { name: 'Garlic Bread', price: 6.99, costPrice: 1.50, category: 'Appetizers', prepTime: 5, isVegetarian: true },
        { name: 'Chicken Wings', price: 14.99, costPrice: 5.00, category: 'Appetizers', prepTime: 15, isSpicy: true },
        { name: 'Soup of the Day', price: 8.99, costPrice: 2.00, category: 'Appetizers', prepTime: 5 },

        // Main Courses
        { name: 'Grilled Salmon', price: 28.99, costPrice: 12.00, category: 'Main Courses', prepTime: 20, isGlutenFree: true },
        { name: 'Ribeye Steak', price: 34.99, costPrice: 15.00, category: 'Main Courses', prepTime: 25 },
        { name: 'Chicken Parmesan', price: 22.99, costPrice: 8.00, category: 'Main Courses', prepTime: 20 },
        { name: 'Vegetable Stir Fry', price: 18.99, costPrice: 5.00, category: 'Main Courses', prepTime: 15, isVegetarian: true, isVegan: true },

        // Pizzas
        { name: 'Margherita Pizza', price: 16.99, costPrice: 4.00, category: 'Pizzas', prepTime: 18, isVegetarian: true },
        { name: 'Pepperoni Pizza', price: 18.99, costPrice: 5.00, category: 'Pizzas', prepTime: 18 },
        { name: 'BBQ Chicken Pizza', price: 20.99, costPrice: 6.00, category: 'Pizzas', prepTime: 18 },
        { name: 'Veggie Supreme Pizza', price: 19.99, costPrice: 5.50, category: 'Pizzas', prepTime: 18, isVegetarian: true },

        // Burgers
        { name: 'Classic Burger', price: 15.99, costPrice: 5.00, category: 'Burgers', prepTime: 15 },
        { name: 'Bacon Cheeseburger', price: 17.99, costPrice: 6.50, category: 'Burgers', prepTime: 15 },
        { name: 'Veggie Burger', price: 14.99, costPrice: 4.50, category: 'Burgers', prepTime: 15, isVegetarian: true },
        { name: 'Mushroom Swiss Burger', price: 16.99, costPrice: 5.50, category: 'Burgers', prepTime: 15 },

        // Sides
        { name: 'French Fries', price: 5.99, costPrice: 1.00, category: 'Sides', prepTime: 8, isVegetarian: true, isVegan: true },
        { name: 'Onion Rings', price: 6.99, costPrice: 1.50, category: 'Sides', prepTime: 8, isVegetarian: true },
        { name: 'Coleslaw', price: 4.99, costPrice: 1.00, category: 'Sides', prepTime: 3, isVegetarian: true },
        { name: 'Mashed Potatoes', price: 5.99, costPrice: 1.50, category: 'Sides', prepTime: 5, isVegetarian: true },

        // Desserts
        { name: 'Chocolate Cake', price: 8.99, costPrice: 2.50, category: 'Desserts', prepTime: 5, isVegetarian: true },
        { name: 'Cheesecake', price: 9.99, costPrice: 3.00, category: 'Desserts', prepTime: 5, isVegetarian: true },
        { name: 'Ice Cream Sundae', price: 7.99, costPrice: 2.00, category: 'Desserts', prepTime: 5, isVegetarian: true },

        // Beverages
        { name: 'Coca-Cola', price: 2.99, costPrice: 0.50, category: 'Beverages', prepTime: 1, isVegetarian: true, isVegan: true },
        { name: 'Fresh Lemonade', price: 4.99, costPrice: 1.00, category: 'Beverages', prepTime: 3, isVegetarian: true, isVegan: true },
        { name: 'Iced Tea', price: 3.49, costPrice: 0.50, category: 'Beverages', prepTime: 1, isVegetarian: true, isVegan: true },
        { name: 'Coffee', price: 3.99, costPrice: 0.75, category: 'Beverages', prepTime: 3, isVegetarian: true, isVegan: true },
    ];

    for (const item of menuItems) {
        await prisma.menuItem.upsert({
            where: {
                id: `${restaurant.id}-${item.name.toLowerCase().replace(/\s+/g, '-')}`,
            },
            update: {},
            create: {
                id: `${restaurant.id}-${item.name.toLowerCase().replace(/\s+/g, '-')}`,
                name: item.name,
                description: `Delicious ${item.name.toLowerCase()}`,
                price: item.price,
                costPrice: item.costPrice,
                preparationTime: item.prepTime,
                isVegetarian: item.isVegetarian || false,
                isVegan: item.isVegan || false,
                isGlutenFree: item.isGlutenFree || false,
                isSpicy: item.isSpicy || false,
                isActive: true,
                isAvailable: true,
                categoryId: createdCategories[item.category],
                restaurantId: restaurant.id,
            },
        });
    }
    console.log(`✅ Created ${menuItems.length} menu items\n`);

    // ============================================
    // 7. CREATE OPERATING HOURS
    // ============================================
    console.log('Creating operating hours...');

    const defaultOpenTime = new Date('1970-01-01T11:00:00Z');
    const defaultCloseTime = new Date('1970-01-01T22:00:00Z');

    for (let day = 0; day <= 6; day++) {
        await prisma.operatingHour.upsert({
            where: {
                restaurantId_dayOfWeek: { restaurantId: restaurant.id, dayOfWeek: day }
            },
            update: {},
            create: {
                dayOfWeek: day,
                openTime: defaultOpenTime,
                closeTime: defaultCloseTime,
                isClosed: false,
                restaurantId: restaurant.id,
            },
        });
    }
    console.log('✅ Created operating hours (11 AM - 10 PM daily)\n');

    // ============================================
    // 8. CREATE INVENTORY ITEMS
    // ============================================
    console.log('Creating inventory items...');

    const inventoryItems = [
        { name: 'Beef Patties', sku: 'INV-001', unit: 'piece', currentStock: 100, minimumStock: 20, costPerUnit: 2.50, category: 'Meat' },
        { name: 'Chicken Breast', sku: 'INV-002', unit: 'kg', currentStock: 25, minimumStock: 5, costPerUnit: 8.00, category: 'Meat' },
        { name: 'Salmon Fillet', sku: 'INV-003', unit: 'kg', currentStock: 10, minimumStock: 3, costPerUnit: 18.00, category: 'Seafood' },
        { name: 'Pizza Dough', sku: 'INV-004', unit: 'piece', currentStock: 50, minimumStock: 15, costPerUnit: 1.00, category: 'Bakery' },
        { name: 'Mozzarella Cheese', sku: 'INV-005', unit: 'kg', currentStock: 15, minimumStock: 5, costPerUnit: 12.00, category: 'Dairy' },
        { name: 'Lettuce', sku: 'INV-006', unit: 'head', currentStock: 30, minimumStock: 10, costPerUnit: 1.50, category: 'Produce' },
        { name: 'Tomatoes', sku: 'INV-007', unit: 'kg', currentStock: 20, minimumStock: 5, costPerUnit: 3.00, category: 'Produce' },
        { name: 'Potatoes', sku: 'INV-008', unit: 'kg', currentStock: 50, minimumStock: 15, costPerUnit: 1.50, category: 'Produce' },
        { name: 'Cooking Oil', sku: 'INV-009', unit: 'liter', currentStock: 20, minimumStock: 5, costPerUnit: 4.00, category: 'Pantry' },
        { name: 'Burger Buns', sku: 'INV-010', unit: 'piece', currentStock: 80, minimumStock: 20, costPerUnit: 0.50, category: 'Bakery' },
    ];

    for (const item of inventoryItems) {
        await prisma.inventoryItem.upsert({
            where: {
                restaurantId_name: { restaurantId: restaurant.id, name: item.name }
            },
            update: {},
            create: {
                ...item,
                isActive: true,
                isLowStock: item.currentStock < item.minimumStock,
                restaurantId: restaurant.id,
            },
        });
    }
    console.log(`✅ Created ${inventoryItems.length} inventory items\n`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📋 Created Resources:');
    console.log(`   • 1 Restaurant: ${restaurant.name}`);
    console.log(`   • 4 Users (admin + 3 staff)`);
    console.log(`   • 1 Floor Plan with 8 Tables`);
    console.log(`   • 7 Menu Categories`);
    console.log(`   • ${menuItems.length} Menu Items`);
    console.log(`   • 7 Operating Hour Records`);
    console.log(`   • ${inventoryItems.length} Inventory Items`);
    console.log('\n📌 Login Credentials:');
    console.log('   Admin:   admin@demo.com / Admin@123');
    console.log('   Manager: manager@demo.com / Staff@123');
    console.log('   Waiter:  waiter@demo.com / Staff@123');
    console.log('   Kitchen: kitchen@demo.com / Staff@123');
    console.log('\n🆔 Restaurant ID:', restaurant.id);
    console.log('═══════════════════════════════════════════════════════\n');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
