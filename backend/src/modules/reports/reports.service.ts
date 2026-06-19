import { Injectable } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';

@Injectable()
export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  async getMonthlyReport(userId: string, month: number, year: number) {
    return this.reportsRepository.getMonthlyReport(userId, month, year);
  }

  async getYearlyReport(userId: string, year: number) {
    return this.reportsRepository.getYearlyReport(userId, year);
  }

  async getCashflowForecast(userId: string) {
    return this.reportsRepository.getCashflowForecast(userId);
  }
}
