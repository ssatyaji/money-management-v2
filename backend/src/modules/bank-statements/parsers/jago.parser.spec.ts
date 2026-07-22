import { JagoParser } from './jago.parser';

describe('JagoParser', () => {
  let parser: JagoParser;

  beforeEach(() => {
    parser = new JagoParser();
  });

  it('should validate Bank Jago statements', () => {
    const text = 'PT Bank Jago Tbk Pockets Transactions History';
    expect(parser.validate(text)).toBe(true);
    expect(parser.validate('Random Bank Statement')).toBe(false);
  });

  it('should return JAGO as bank name', () => {
    expect(parser.getBankName()).toBe('JAGO');
  });

  it('should parse multi-line Bank Jago e-statement format correctly', async () => {
    const sampleText = `
PT Bank Jago Tbk is licensed and supervised by Financial Services Authority (OJK), Bank Indonesia, and
also a member of Indonesia Deposit Insurance Corporation (LPS) deposit insurance program. www.jago.com
Pockets Transactions History Page 1 of 4
Muhammad Sidiq Satyaji
Main Pocket 107193004147
Showing IDR transaction from Latest Balance per 22 Jul 2026
01 Jul 2026 - 31 Jul 2026 IDR 6.937,28
Date & Time Source/Destination Transaction Details Notes Amount Balance
July 2026
01 Jul 2026
04:48
MUHAMMAD SIDIQ
SATYAJI
GoPay 085711717651
Outgoing Transfer
ID# s5gYNqmb3ItykHGvCZ
-3.000 7.507,28
01 Jul 2026
06:35
Tabungan Dana Darurat
Movement between Pockets
Pocket Money Out
ID# 260701-XXGV-L3RAMK
+3.000 10.507,28
03 Jul 2026
14:30
FELIX HENDRIAN
Permata Bank 7385277
Incoming Transfer
ID# 260703-WW2H-3RZ3AH
+30.000,00 30.507,28
`;

    const result = await parser.parse(sampleText);

    expect(result.accountNumber).toBe('107193004147');
    expect(result.accountHolder).toBe('Muhammad Sidiq Satyaji');
    expect(result.statementDate).toBeDefined();
    expect(result.statementDate?.getFullYear()).toBe(2026);
    expect(result.statementDate?.getMonth()).toBe(6); // July (0-indexed)

    expect(result.transactions.length).toBe(3);

    // Transaction 1
    expect(result.transactions[0].type).toBe('EXPENSE');
    expect(result.transactions[0].amount).toBe(3000);
    expect(result.transactions[0].balance).toBe(7507.28);
    expect(result.transactions[0].description).toContain('GoPay 085711717651');

    // Transaction 2
    expect(result.transactions[1].type).toBe('INCOME');
    expect(result.transactions[1].amount).toBe(3000);
    expect(result.transactions[1].balance).toBe(10507.28);
    expect(result.transactions[1].description).toContain('Tabungan Dana Darurat');

    // Transaction 3
    expect(result.transactions[2].type).toBe('INCOME');
    expect(result.transactions[2].amount).toBe(30000);
    expect(result.transactions[2].balance).toBe(30507.28);
    expect(result.transactions[2].description).toContain('FELIX HENDRIAN');
  });
});
