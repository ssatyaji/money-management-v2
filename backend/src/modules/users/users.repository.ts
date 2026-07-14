import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        where,
        orderBy,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          isEmailVerified: true,
          lastLoginAt: true,
          lastActivityAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total };
  }

  async delete(id: string): Promise<User> {
    return this.prisma.$transaction(async (tx) => {
      // Delete user data in correct order to avoid foreign key violations
      await tx.transaction.deleteMany({ where: { userId: id } });
      await tx.budget.deleteMany({ where: { userId: id } });
      await tx.recurringTransaction.deleteMany({ where: { userId: id } });
      await tx.category.deleteMany({ where: { userId: id } });
      return tx.user.delete({ where: { id } });
    });
  }
}

