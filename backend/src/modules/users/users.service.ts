import { Injectable, NotFoundException } from '@nestjs/common';
import { User, Role, Prisma } from '@prisma/client';
import { UsersRepository } from './users.repository';
import { FilterUserDto } from './dto/filter-user.dto';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async create(data: {
    email: string;
    password: string;
    name: string;
    firstName?: string;
    lastName?: string;
    occupation?: string;
    phoneNumber?: string;
    monthlyIncome?: number;
    startingBalance?: number;
    financialGoal?: string;
    avatar?: string | null;
    isEmailVerified?: boolean;
  }): Promise<User> {
    return this.usersRepository.create(data);
  }

  async updateRefreshToken(
    id: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.usersRepository.update(id, { refreshToken });
  }

  async findAll(
    filterDto: FilterUserDto,
  ): Promise<PaginatedResult<Partial<User>>> {
    const where: Prisma.UserWhereInput = {};
    if (filterDto.search) {
      where.OR = [
        { name: { contains: filterDto.search, mode: 'insensitive' } },
        { email: { contains: filterDto.search, mode: 'insensitive' } },
      ];
    }

    const { data, total } = await this.usersRepository.findAll({
      skip: filterDto.skip,
      take: filterDto.limit,
      where,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data,
      meta: {
        page: filterDto.page,
        limit: filterDto.limit,
        total,
        totalPages: Math.ceil(total / filterDto.limit),
      },
    };
  }

  async update(
    id: string,
    data: {
      name?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      occupation?: string;
      phoneNumber?: string;
      monthlyIncome?: number;
      startingBalance?: number;
      financialGoal?: string;
      role?: Role;
      isEmailVerified?: boolean;
      avatar?: string | null;
    },
  ): Promise<User> {
    await this.findById(id); // Throws if not found
    return this.usersRepository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.usersRepository.delete(id);
  }
}
