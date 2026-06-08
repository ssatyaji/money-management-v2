import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async findAllForUser(userId: string, type?: TransactionType) {
    return this.categoriesRepository.findByUserAndType(userId, type);
  }

  async findById(id: string) {
    const category = await this.categoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(userId: string, dto: CreateCategoryDto) {
    return this.categoriesRepository.create({
      name: dto.name,
      icon: dto.icon,
      color: dto.color,
      type: dto.type,
      isDefault: false,
      user: { connect: { id: userId } },
    });
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.findById(id);

    if (category.isDefault) {
      throw new ForbiddenException('Cannot edit default categories');
    }
    if (category.userId !== userId) {
      throw new ForbiddenException('You can only edit your own categories');
    }

    return this.categoriesRepository.update(id, dto);
  }

  async remove(userId: string, id: string) {
    const category = await this.findById(id);

    if (category.isDefault) {
      throw new ForbiddenException('Cannot delete default categories');
    }
    if (category.userId !== userId) {
      throw new ForbiddenException('You can only delete your own categories');
    }

    const txCount = await this.categoriesRepository.countTransactions(id);
    if (txCount > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${txCount} transactions. Reassign transactions first.`,
      );
    }

    return this.categoriesRepository.delete(id);
  }
}
