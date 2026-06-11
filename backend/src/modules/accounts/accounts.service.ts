import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AccountsRepository } from './accounts.repository';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account, Prisma } from '@prisma/client';

export interface EnrichedAccount extends Account {
  balance: number;
}

@Injectable()
export class AccountsService {
  constructor(private readonly accountsRepository: AccountsRepository) {}

  async create(userId: string, dto: CreateAccountDto): Promise<EnrichedAccount> {
    const account = await this.accountsRepository.create({
      name: dto.name,
      color: dto.color ?? '#3b82f6',
      startingBalance: dto.startingBalance ?? 0,
      userId,
    });
    return {
      ...account,
      balance: Number(account.startingBalance),
    };
  }

  async findAll(userId: string): Promise<EnrichedAccount[]> {
    const user = await this.accountsRepository.getUserStartingBalance(userId);
    const userStartingBalance = Number(user?.startingBalance) || 0;

    const mainBalance = await this.accountsRepository.calculateBalance(
      userId,
      null,
      userStartingBalance,
    );

    const mainAccount: EnrichedAccount = {
      id: 'main',
      name: 'Saldo Utama',
      color: '#6366f1',
      startingBalance: user?.startingBalance || new Prisma.Decimal(0),
      userId,
      createdAt: user?.createdAt || new Date(),
      updatedAt: user?.updatedAt || new Date(),
      balance: mainBalance,
    };

    const accounts = await this.accountsRepository.findAll({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    const enrichedDbAccounts = await Promise.all(
      accounts.map(async (account) => {
        const balance = await this.accountsRepository.calculateBalance(
          userId,
          account.id,
          Number(account.startingBalance),
        );
        return {
          ...account,
          balance,
        };
      }),
    );

    return [mainAccount, ...enrichedDbAccounts];
  }

  async findById(userId: string, id: string): Promise<EnrichedAccount> {
    if (id === 'main') {
      const user = await this.accountsRepository.getUserStartingBalance(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const balance = await this.accountsRepository.calculateBalance(
        userId,
        null,
        Number(user.startingBalance),
      );
      return {
        id: 'main',
        name: 'Saldo Utama',
        color: '#6366f1',
        startingBalance: user.startingBalance,
        userId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        balance,
      };
    }

    const account = await this.accountsRepository.findById(id);
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    if (account.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const balance = await this.accountsRepository.calculateBalance(
      userId,
      account.id,
      Number(account.startingBalance),
    );

    return {
      ...account,
      balance,
    };
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateAccountDto,
  ): Promise<EnrichedAccount> {
    if (id === 'main') {
      throw new ForbiddenException('Cannot edit default Saldo Utama wallet');
    }

    await this.findById(userId, id); // validates exists and ownership

    const account = await this.accountsRepository.update(id, {
      name: dto.name,
      color: dto.color,
      startingBalance: dto.startingBalance,
    });

    const balance = await this.accountsRepository.calculateBalance(
      userId,
      account.id,
      Number(account.startingBalance),
    );

    return {
      ...account,
      balance,
    };
  }

  async remove(userId: string, id: string): Promise<void> {
    if (id === 'main') {
      throw new ForbiddenException('Cannot delete default Saldo Utama wallet');
    }

    await this.findById(userId, id); // validates exists and ownership
    await this.accountsRepository.delete(id);
  }
}
