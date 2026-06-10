import { PrismaClient, Role, TransactionType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@moneymanagement.com' },
    update: {},
    create: {
      email: 'admin@moneymanagement.com',
      password: hashedPassword,
      name: 'Administrator',
      role: Role.ADMIN,
      isEmailVerified: true,
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // Create default expense categories
  const expenseCategories = [
    { name: 'Makanan & Minuman', icon: '🍔', color: '#ef4444', type: TransactionType.EXPENSE },
    { name: 'Transportasi', icon: '🚗', color: '#f97316', type: TransactionType.EXPENSE },
    { name: 'Belanja', icon: '🛍️', color: '#eab308', type: TransactionType.EXPENSE },
    { name: 'Hiburan', icon: '🎬', color: '#a855f7', type: TransactionType.EXPENSE },
    { name: 'Tagihan & Utilitas', icon: '💡', color: '#3b82f6', type: TransactionType.EXPENSE },
    { name: 'Kesehatan', icon: '🏥', color: '#ec4899', type: TransactionType.EXPENSE },
    { name: 'Pendidikan', icon: '📚', color: '#6366f1', type: TransactionType.EXPENSE },
    { name: 'Rumah Tangga', icon: '🏠', color: '#14b8a6', type: TransactionType.EXPENSE },
    { name: 'Asuransi', icon: '🛡️', color: '#64748b', type: TransactionType.EXPENSE },
    { name: 'Lainnya', icon: '📦', color: '#78716c', type: TransactionType.EXPENSE },
  ];

  // Create default income categories
  const incomeCategories = [
    { name: 'Gaji', icon: '💰', color: '#22c55e', type: TransactionType.INCOME },
    { name: 'Freelance', icon: '💻', color: '#06b6d4', type: TransactionType.INCOME },
    { name: 'Investasi', icon: '📈', color: '#8b5cf6', type: TransactionType.INCOME },
    { name: 'Transfer Masuk', icon: '🔄', color: '#0ea5e9', type: TransactionType.INCOME },
    { name: 'Bonus', icon: '🎁', color: '#f59e0b', type: TransactionType.INCOME },
    { name: 'Penjualan', icon: '🏷️', color: '#10b981', type: TransactionType.INCOME },
    { name: 'Lainnya', icon: '📦', color: '#78716c', type: TransactionType.INCOME },
  ];

  const allCategories = [...expenseCategories, ...incomeCategories];

  // Clean up existing default categories to prevent duplicates when running seed multiple times
  await prisma.category.deleteMany({
    where: {
      userId: null,
      isDefault: true,
    },
  });

  // Re-create default categories cleanly
  await prisma.category.createMany({
    data: allCategories.map((cat) => ({
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      type: cat.type,
      isDefault: true,
      userId: null,
    })),
    skipDuplicates: true,
  });

  // Fetch categories to use their IDs
  const dbCategories = await prisma.category.findMany();
  const incomeCats = dbCategories.filter((c) => c.type === 'INCOME');
  const expenseCats = dbCategories.filter((c) => c.type === 'EXPENSE');

  // Clear existing transactions for admin to avoid duplicates on re-seed
  await prisma.transaction.deleteMany({
    where: { userId: admin.id },
  });

  const dummyTransactions = [];
  const now = new Date();

  // Create about 120 transactions over the last 90 days
  for (let i = 0; i < 120; i++) {
    const isIncome = Math.random() > 0.7; // 30% income, 70% expense
    const category = isIncome
      ? incomeCats[Math.floor(Math.random() * incomeCats.length)]
      : expenseCats[Math.floor(Math.random() * expenseCats.length)];

    // random date within last 90 days
    const randomDaysAgo = Math.floor(Math.random() * 90);
    const date = new Date(now);
    date.setDate(now.getDate() - randomDaysAgo);

    const amount = isIncome
      ? Math.floor(Math.random() * 5000000) + 1000000 // 1jt - 6jt
      : Math.floor(Math.random() * 500000) + 15000; // 15rb - 515rb

    dummyTransactions.push({
      userId: admin.id,
      categoryId: category.id,
      amount,
      type: category.type,
      date,
      description: `Dummy ${category.name} transaction`,
      source: 'MANUAL' as const,
    });
  }

  await prisma.transaction.createMany({
    data: dummyTransactions,
  });

  console.log(`✅ ${dummyTransactions.length} dummy transactions created for admin over the last 3 months`);
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
