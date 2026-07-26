import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertsRepository } from './alerts.repository';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);
  constructor(
    private readonly repo: AlertsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getActiveAlerts(userId: string) {
    try {
      await this.evaluateAlerts(userId);
    } catch (e) {
      this.logger.error(`Error evaluating alerts for user ${userId}`, e);
    }

    const alerts = await this.repo.findActiveByUser(userId);
    return alerts.map((a) => {
      const meta = (a.metadata as Record<string, any>) || {};
      return {
        ...a,
        actionUrl: meta.actionUrl || null,
        actionLabel: meta.actionLabel || null,
      };
    });
  }

  markAsRead(userId: string, alertId: string) {
    return this.repo.markAsRead(alertId, userId);
  }

  markAllAsRead(userId: string) {
    return this.repo.markAllAsRead(userId);
  }

  async evaluateAlerts(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const expire3d = new Date(now); expire3d.setDate(now.getDate() + 3);
    const expire1d = new Date(now); expire1d.setDate(now.getDate() + 1);
    const expire7d = new Date(now); expire7d.setDate(now.getDate() + 7);

    // Rule 1: BUDGET_OVERRUN
    const budgets = await this.prisma.budget.findMany({
      where: { userId, period: 'MONTHLY' },
      include: { category: true },
    });
    for (const b of budgets) {
      if (!b.categoryId) continue;
      const spent = await this.prisma.transaction.aggregate({
        where: {
          userId,
          categoryId: b.categoryId,
          type: 'EXPENSE',
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      });
      const pct = Math.round(((Number(spent._sum.amount) || 0) / Number(b.amount)) * 100);
      if (pct >= 80) {
        await this.repo.upsertAlert({
          userId,
          type: `BUDGET_OVERRUN_${b.categoryId}`,
          title: 'Budget Hampir Habis',
          message: `Budget ${b.category?.name} sudah terpakai ${pct}%`,
          severity: pct >= 100 ? 'DANGER' : 'WARNING',
          metadata: { budgetId: b.id, pct, actionUrl: '/budgets', actionLabel: 'Tinjau Anggaran' },
          expiresAt: expire3d,
        });
      }
    }

    // Rule 2: DEBT_DUE
    const due7d = new Date(now); due7d.setDate(now.getDate() + 7);
    const dueDebts = await this.prisma.debt.findMany({
      where: {
        userId,
        status: { in: ['ACTIVE', 'PARTIALLY_PAID'] },
        dueDate: { gte: now, lte: due7d },
      },
    });
    for (const d of dueDebts) {
      const days = Math.ceil((new Date(d.dueDate!).getTime() - now.getTime()) / 86400000);
      await this.repo.upsertAlert({
        userId,
        type: `DEBT_DUE_${d.id}`,
        title: 'Utang Jatuh Tempo',
        message: `${d.type === 'RECEIVABLE' ? 'Piutang' : 'Utang'} ke ${d.personName} jatuh tempo ${days === 0 ? 'hari ini' : `${days} hari lagi`}`,
        severity: 'DANGER',
        metadata: { debtId: d.id, days, actionUrl: '/debts', actionLabel: 'Kelola Utang' },
        expiresAt: expire1d,
      });
    }

    // Rule 3: GOAL_BEHIND
    const goals = await this.prisma.savingGoal.findMany({
      where: { userId, status: 'ACTIVE', deadline: { not: null } },
    });
    for (const g of goals) {
      if (!g.deadline) continue;
      const totalDays = Math.max((new Date(g.deadline).getTime() - new Date(g.createdAt).getTime()) / 86400000, 1);
      const daysPassed = (now.getTime() - new Date(g.createdAt).getTime()) / 86400000;
      const expectedPct = Math.min(daysPassed / totalDays, 1);
      const actualPct = Number(g.currentAmount) / Number(g.targetAmount);
      if (actualPct < expectedPct * 0.8) {
        await this.repo.upsertAlert({
          userId,
          type: `GOAL_BEHIND_${g.id}`,
          title: 'Goal di Belakang Target',
          message: `Tabungan "${g.name}" baru ${Math.round(actualPct * 100)}%, seharusnya ${Math.round(expectedPct * 100)}%`,
          severity: 'INFO',
          metadata: { goalId: g.id, actionUrl: '/goals', actionLabel: 'Setor Tabungan' },
          expiresAt: expire3d,
        });
      }
    }

    // Rule 4: LOW_BALANCE
    const wallets = await this.prisma.account.findMany({
      where: { userId },
      select: { startingBalance: true },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { startingBalance: true },
    });
    const atx = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: { userId },
      _sum: { amount: true },
    });
    let ai = 0, ae = 0;
    atx.forEach((t) => {
      if (t.type === 'INCOME') ai = Number(t._sum.amount) || 0;
      if (t.type === 'EXPENSE') ae = Number(t._sum.amount) || 0;
    });
    const bal = Number(user?.startingBalance || 0) + wallets.reduce((s, w) => s + Number(w.startingBalance || 0), 0) + ai - ae;
    const mTx = await this.prisma.transaction.aggregate({
      where: { userId, type: 'INCOME', date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    });
    const mInc = Number(mTx._sum.amount) || bal;
    if (bal < mInc * 0.05) {
      await this.repo.upsertAlert({
        userId,
        type: 'LOW_BALANCE',
        title: 'Saldo Kritis',
        message: 'Saldo kamu sangat rendah. Perhatikan pengeluaran bulan ini.',
        severity: 'DANGER',
        metadata: { actionUrl: '/transactions/new', actionLabel: 'Catat Pemasukan' },
        expiresAt: expire1d,
      });
    }

    // Rule 5: POSITIVE_STREAK
    let streak = true;
    for (let i = 1; i <= 3; i++) {
      const s = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const e = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const tx = await this.prisma.transaction.groupBy({
        by: ['type'],
        where: { userId, date: { gte: s, lte: e } },
        _sum: { amount: true },
      });
      let inc = 0, exp = 0;
      tx.forEach((t) => {
        if (t.type === 'INCOME') inc = Number(t._sum.amount) || 0;
        if (t.type === 'EXPENSE') exp = Number(t._sum.amount) || 0;
      });
      if (inc <= exp) {
        streak = false;
        break;
      }
    }
    if (streak) {
      await this.repo.upsertAlert({
        userId,
        type: 'POSITIVE_STREAK',
        title: 'Streak Surplus! 🎉',
        message: 'Keuanganmu surplus 3 bulan berturut-turut. Pertahankan!',
        severity: 'SUCCESS',
        metadata: { actionUrl: '/dashboard', actionLabel: 'Lihat Detail' },
        expiresAt: expire7d,
      });
    }

    await this.repo.deleteExpired();
  }
}
