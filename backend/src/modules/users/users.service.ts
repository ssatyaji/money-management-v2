import { Injectable, NotFoundException } from '@nestjs/common';
import { User, Role } from '@prisma/client';
import { UsersRepository } from './users.repository';
import { PaginationDto } from '../../common/dto/pagination.dto';
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

  async create(data: { email: string; password: string; name: string }): Promise<User> {
    return this.usersRepository.create(data);
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await this.usersRepository.update(id, { refreshToken });
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<Partial<User>>> {
    const { data, total } = await this.usersRepository.findAll({
      skip: paginationDto.skip,
      take: paginationDto.limit,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data,
      meta: {
        page: paginationDto.page,
        limit: paginationDto.limit,
        total,
        totalPages: Math.ceil(total / paginationDto.limit),
      },
    };
  }

  async update(id: string, data: { name?: string; role?: Role }): Promise<User> {
    await this.findById(id); // Throws if not found
    return this.usersRepository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.usersRepository.delete(id);
  }
}
