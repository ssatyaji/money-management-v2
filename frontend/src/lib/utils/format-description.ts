/**
 * Smart transaction description parser and cleaner.
 * Formats raw bank statement descriptions into clean title and subtitle.
 */

export interface FormattedDescription {
  title: string;
  subtitle: string;
  raw: string;
}

export function parseSmartDescription(rawDescription: string): FormattedDescription {
  if (!rawDescription) {
    return { title: 'Transaksi', subtitle: '', raw: '' };
  }

  const text = rawDescription.trim();

  // 1. Transfer BI-FAST Incoming (DARI)
  // e.g. "TRF INCOMING BIFAST DARI RICHIE CHOW 1106411131 BANK JAGO TBK 16:50:44"
  const trfIncMatch = text.match(
    /TRF\s+(?:INCOMING\s+)?BIFAST\s+DARI\s+([A-Z\s]+?)(?:\s+\d+)?\s+(?:PT\s+BANK|BANK)\s+([A-Z\s]+?)(?:\s+\d{2}:\d{2}:\d{2}|$)/i,
  );
  if (trfIncMatch) {
    const name = cleanName(trfIncMatch[1]);
    const bank = cleanBankName(trfIncMatch[2]);
    return {
      title: name || 'Transfer Masuk',
      subtitle: `Transfer Masuk dari ${bank}`,
      raw: text,
    };
  }

  // Fallback Incoming Transfer
  const trfIncGeneric = text.match(
    /TRF\s+(?:INCOMING|DARI)\s+([A-Z\s]+?)(?:\s+\d+)?(?:\s+(?:PT\s+BANK|BANK)\s+([A-Z\s]+))?/i,
  );
  if (trfIncGeneric && (text.includes('INCOMING') || text.includes('DARI'))) {
    const name = cleanName(trfIncGeneric[1]);
    const bank = trfIncGeneric[2] ? cleanBankName(trfIncGeneric[2]) : '';
    return {
      title: name || 'Transfer Masuk',
      subtitle: bank ? `Transfer Masuk dari ${bank}` : 'Transfer Masuk',
      raw: text,
    };
  }

  // 2. Transfer BI-FAST Outgoing (KE)
  // e.g. "TRF BIFAST KE QISTHI LARASATI 1793655839 PT BANK SEABANK INDONESIA Permata ME 12:54:31 - 00014519331"
  const trfOutMatch = text.match(
    /TRF\s+(?:BIFAST\s+)?KE\s+([A-Z\s]+?)(?:\s+\d+)?\s+(?:PT\s+BANK|BANK)\s+([A-Z\s]+?)(?:\s+Permata|\s+\d{2}:\d{2}|$)/i,
  );
  if (trfOutMatch) {
    const name = cleanName(trfOutMatch[1]);
    const bank = cleanBankName(trfOutMatch[2]);
    return {
      title: name || 'Transfer Keluar',
      subtitle: `Transfer ke ${bank}`,
      raw: text,
    };
  }

  // Fallback Outgoing Transfer (KE)
  const trfOutGeneric = text.match(/TRF\s+(?:BIFAST\s+)?KE\s+([A-Z\s]+?)(?:\s+\d+)?(?:\s+(.*))?$/i);
  if (trfOutGeneric) {
    const name = cleanName(trfOutGeneric[1]);
    return {
      title: name || 'Transfer Keluar',
      subtitle: 'Transfer Keluar',
      raw: text,
    };
  }

  // 3. Pemindahbukuan (PB KE / PB DARI)
  // e.g. "PB KE DEWI SARTIKA BR SIMALANGO 7370210 Permata ME 11:04:33"
  const pbKeMatch = text.match(/PB\s+KE\s+([A-Z\s]+?)(?:\s+\d+)?(?:\s+Permata|\s+\d{2}:\d{2}|$)/i);
  if (pbKeMatch) {
    return {
      title: cleanName(pbKeMatch[1]),
      subtitle: 'Pemindahbukuan (Permata)',
      raw: text,
    };
  }

  const pbDariMatch = text.match(/PB\s+DARI\s+([A-Z\s]+?)(?:\s+Permata|\s+\d{2}:\d{2}|$)/i);
  if (pbDariMatch) {
    return {
      title: cleanName(pbDariMatch[1]),
      subtitle: 'Pemindahbukuan Masuk (Permata)',
      raw: text,
    };
  }

  // 4. QRIS Payment
  // e.g. "QR PAYMENT 14:45:34 Kopi Calf To GoCeger Bin TANGSEL Rp 18,000.00"
  // e.g. "QR PAYMENT CPM BERSAMA 19:58:24 INDOMARET JAKARTA UTARAID"
  const qrMatch = text.match(/QR\s+PAYMENT\s*(?:CPM\s+BERSAMA)?\s*(?:\d{2}:\d{2}:\d{2})?\s*(.+)/i);
  if (qrMatch) {
    let merchant = qrMatch[1]
      .replace(/\s*Rp\s*[\d,]+\.\d{2}$/i, '')
      .replace(/\s*ID$/i, '')
      .replace(/\b(?:TANGSEL|TANGERANG|TANGERANG\s+SELAT|JAKARTA\s+UTARA|JAKARTA\s+SELATAN|BOGOR)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      title: cleanName(merchant) || 'Pembayaran QRIS',
      subtitle: 'Pembayaran QRIS',
      raw: text,
    };
  }

  // 5. Clean Fallback for other descriptions
  let cleaned = text
    .replace(/\b\d{2}:\d{2}:\d{2}\b/g, '') // remove timestamps
    .replace(/\b\d{7,}\b/g, '') // remove long account/ref numbers
    .replace(/\s+/g, ' ')
    .trim();

  return {
    title: cleaned || text,
    subtitle: 'Transaksi Bank',
    raw: text,
  };
}

function cleanName(str: string): string {
  if (!str) return '';
  return str
    .replace(/\b(?:TBK|PT|CV|ME|ID)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function cleanBankName(str: string): string {
  if (!str) return 'Bank';
  const upper = str.toUpperCase();
  if (upper.includes('SEABANK')) return 'SeaBank';
  if (upper.includes('JAGO')) return 'Bank Jago';
  if (upper.includes('BCA')) return 'Bank BCA';
  if (upper.includes('MANDIRI')) return 'Bank Mandiri';
  if (upper.includes('BRI') || upper.includes('RAKYAT')) return 'Bank BRI';
  if (upper.includes('BNI')) return 'Bank BNI';
  if (upper.includes('PERMATA')) return 'Permata Bank';
  if (upper.includes('ALLO')) return 'Allo Bank';
  return cleanName(str);
}
