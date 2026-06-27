import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { OcrModule } from './modules/ocr/ocr.module';
import { BankStatementsModule } from './modules/bank-statements/bank-statements.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { RecurringTransactionsModule } from './modules/recurring-transactions/recurring-transactions.module';
import { SavingGoalsModule } from './modules/saving-goals/saving-goals.module';
import { DebtsModule } from './modules/debts/debts.module';
import { InvestmentsModule } from './modules/investments/investments.module';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HealthController } from './common/health.controller';
import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import mailConfig from './config/mail.config';
import storageConfig from './config/storage.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, redisConfig, mailConfig, storageConfig],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 60, // 60 requests per minute
      },
    ]),

    // Scheduling
    ScheduleModule.forRoot(),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    CategoriesModule,
    TransactionsModule,
    BudgetsModule,
    ReportsModule,
    RemindersModule,
    OcrModule,
    BankStatementsModule,
    NotificationsModule,
    AdminModule,
    AccountsModule,
    RecurringTransactionsModule,
    SavingGoalsModule,
    DebtsModule,
    InvestmentsModule,
  ],
  controllers: [HealthController],
  providers: [
    // Global JWT auth guard — all routes require auth by default
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global roles guard
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Global rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
