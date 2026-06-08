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

  for (const category of allCategories) {
    await prisma.category.upsert({
      where: {
        name_userId: {
          name: category.name,
          userId: '', // system default uses empty string trick - we handle null below
        },
      },
      update: {},
      create: {
        name: category.name,
        icon: category.icon,
        color: category.color,
        type: category.type,
        isDefault: true,
        userId: null,
      },
    });
  }

  // Since upsert with null composite key doesn't work well, use createMany with skipDuplicates
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

  console.log(`✅ ${allCategories.length} default categories created`);
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
