import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class AiAdvisorService {
  private readonly logger = new Logger(AiAdvisorService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('gemini.apiKey') || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  createSession(userId: string, dto: CreateSessionDto) {
    return this.prisma.aiChatSession.create({
      data: {
        userId,
        context: dto.context || 'GENERAL',
        contextId: dto.contextId,
      },
    });
  }

  getSession(userId: string, sessionId: string) {
    return this.prisma.aiChatSession.findFirst({
      where: { id: sessionId, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async sendMessage(userId: string, sessionId: string, content: string) {
    const session = await this.getSession(userId, sessionId);
    if (!session) throw new Error('Session not found');

    await this.prisma.aiChatMessage.create({
      data: { sessionId, role: 'user', content },
    });

    const ctx = await this.buildFinancialContext(userId, session.context, session.contextId);
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(`${this.getSystemPrompt(ctx)}\n\nPertanyaan: ${content}`);
    const reply = result.response.text();

    await this.prisma.aiChatMessage.create({
      data: { sessionId, role: 'assistant', content: reply },
    });

    return { role: 'assistant', content: reply };
  }

  getInsights(userId: string) {
    return this.prisma.aiInsight.findMany({
      where: { userId, isRead: false, expiresAt: { gt: new Date() } },
      orderBy: { generatedAt: 'desc' },
      take: 3,
    });
  }

  async generateInsightsForUser(userId: string) {
    const ctx = await this.buildFinancialContext(userId, 'GENERAL', null);
    await this.prisma.aiInsight.deleteMany({ where: { userId } });
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `${this.getSystemPrompt(ctx)}\n\nBerikan TEPAT 3 insight keuangan dalam format JSON array (tanpa markdown):\n[{"title":"max 8 kata","body":"2-3 kalimat actionable","actionLabel":null,"actionUrl":null}]`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response
        .text()
        .replace(/\`\`\`json\n?/g, '')
        .replace(/\`\`\`\n?/g, '')
        .trim();
      const items: Array<{
        title: string;
        body: string;
        actionLabel?: string;
        actionUrl?: string;
      }> = JSON.parse(text);

      const exp = new Date();
      exp.setDate(exp.getDate() + 7);

      for (const item of items.slice(0, 3)) {
        await this.prisma.aiInsight.create({
          data: {
            userId,
            title: item.title,
            body: item.body,
            actionLabel: item.actionLabel || null,
            actionUrl: item.actionUrl || null,
            expiresAt: exp,
          },
        });
      }
    } catch (e) {
      this.logger.error(`Insight generation failed for ${userId}`, e);
    }
  }

  private async buildFinancialContext(
    userId: string,
    context: string | null,
    contextId: string | null,
  ): Promise<string> {
    const now = new Date();
    const som = new Date(now.getFullYear(), now.getMonth(), 1);
    const eom = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { startingBalance: true },
    });
    const wallets = await this.prisma.account.findMany({
      where: { userId },
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

    const mtx = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: { userId, date: { gte: som, lte: eom } },
      _sum: { amount: true },
    });
    let mi = 0, me = 0;
    mtx.forEach((t) => {
      if (t.type === 'INCOME') mi = Number(t._sum.amount) || 0;
      if (t.type === 'EXPENSE') me = Number(t._sum.amount) || 0;
    });

    const topCat = await this.prisma.$queryRaw<Array<{ name: string; total: number }>>`
      SELECT c."name", CAST(SUM(t."amount") AS FLOAT) as total FROM "transactions" t JOIN "categories" c ON t."categoryId"=c."id"
      WHERE t."userId"=${userId} AND t."type"='EXPENSE' AND t."date">=${som} AND t."date"<=${eom}
      GROUP BY c."name" ORDER BY total DESC LIMIT 5`;

    const goals = await this.prisma.savingGoal.findMany({
      where: { userId, status: 'ACTIVE' },
      select: { name: true, targetAmount: true, currentAmount: true },
    });

    const debts = await this.prisma.debt.findMany({
      where: { userId, status: { in: ['ACTIVE', 'PARTIALLY_PAID'] } },
      select: { personName: true, type: true, totalAmount: true, paidAmount: true },
      take: 5,
    });

    let extra = '';
    if (context === 'DEBT' && contextId) {
      const d = await this.prisma.debt.findUnique({ where: { id: contextId } });
      if (d)
        extra = `\nKonteks: utang/piutang ke ${d.personName}, total Rp${Number(d.totalAmount).toLocaleString('id-ID')}, dibayar Rp${Number(d.paidAmount).toLocaleString('id-ID')}.`;
    } else if (context === 'GOAL' && contextId) {
      const g = await this.prisma.savingGoal.findUnique({ where: { id: contextId } });
      if (g)
        extra = `\nKonteks: goal "${g.name}", target Rp${Number(g.targetAmount).toLocaleString('id-ID')}, terkumpul Rp${Number(g.currentAmount).toLocaleString('id-ID')}.`;
    }

    return `Saldo: Rp${Math.round(bal).toLocaleString('id-ID')}\nPemasukan bulan ini: Rp${Math.round(mi).toLocaleString('id-ID')}\nPengeluaran bulan ini: Rp${Math.round(me).toLocaleString('id-ID')}\nTop kategori: ${topCat
      .map((c) => `${c.name}(Rp${Math.round(c.total).toLocaleString('id-ID')})`)
      .join(', ')}\nGoals: ${goals
      .map((g) => `${g.name}(${Math.round((Number(g.currentAmount) / Number(g.targetAmount)) * 100)}%)`)
      .join(', ') || 'Tidak ada'}\nUtang: ${debts
      .map((d) => `${d.type === 'RECEIVABLE' ? 'Piutang' : 'Utang'} ke ${d.personName}`)
      .join(', ') || 'Tidak ada'}${extra}`;
  }

  private getSystemPrompt(ctx: string): string {
    return `Kamu adalah AI financial advisor untuk Zayn Finance.\n\nKondisi keuangan pengguna:\n${ctx}\n\nInstruksi:\n- Jawab Bahasa Indonesia, natural dan ramah\n- Saran spesifik dan actionable\n- Jangan rekomendasikan produk luar\n- Maks 3 paragraf\n- Format Rp untuk nominal`;
  }
}
