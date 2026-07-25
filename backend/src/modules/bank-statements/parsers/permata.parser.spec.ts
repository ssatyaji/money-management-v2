import { PermataParser } from './permata.parser';

describe('PermataParser', () => {
  let parser: PermataParser;

  beforeEach(() => {
    parser = new PermataParser();
  });

  it('should validate Bank Permata statements', () => {
    const text = 'PT Bank Permata, Tbk. berizin dan diawasi oleh Otoritas Jasa Keuangan';
    expect(parser.validate(text)).toBe(true);
    expect(parser.validate('Random Bank Statement')).toBe(false);
  });

  it('should return PERMATA as bank name', () => {
    expect(parser.getBankName()).toBe('PERMATA');
  });

  it('should parse Permata ME Transaction History PDF format correctly', async () => {
    const sampleText = `
July 2026
Tabungan
0000-0740-0756
Transaction History
25 July 2026
TRF INCOMING BIFAST DARI RICHIE CHOW 1106411131 BANK
JAGO TBK 16:50:44 Rp 19,000,000.00
QR PAYMENT 14:45:34 Kopi Calf To GoCeger Bin TANGSEL Rp 18,000.00
QR PAYMENT 14:41:28 Warung Sego Pincuk Tangerang Selat Rp 23,000.00
TRF BIFAST KE QISTHI LARASATI 1793655839 PT BANK
SEABANK INDONESIA Permata ME 12:54:31 - 00014519331 Rp 800,000.00
24 July 2026
QR PAYMENT 19:46:19 dKrispy ChickenCab 037 Tangerang
Selat Rp 28,000.00
PT Bank Permata, Tbk. berizin dan diawasi oleh Otoritas Jasa Keuangan dan Bank Indonesia
Halaman/ Page 1 / 1
`;

    const result = await parser.parse(sampleText);

    expect(result.accountNumber).toBe('000007400756');
    expect(result.statementDate).toBeDefined();
    expect(result.transactions.length).toBe(5);

    // Transaction 1 (Income)
    expect(result.transactions[0].type).toBe('INCOME');
    expect(result.transactions[0].amount).toBe(19000000);
    expect(result.transactions[0].description).toContain('TRF INCOMING BIFAST DARI RICHIE CHOW');

    // Transaction 2 (Expense)
    expect(result.transactions[1].type).toBe('EXPENSE');
    expect(result.transactions[1].amount).toBe(18000);
    expect(result.transactions[1].description).toContain('Kopi Calf To GoCeger');

    // Transaction 4 (Expense)
    expect(result.transactions[3].type).toBe('EXPENSE');
    expect(result.transactions[3].amount).toBe(800000);
    expect(result.transactions[3].description).toContain('QISTHI LARASATI');
  });
});
