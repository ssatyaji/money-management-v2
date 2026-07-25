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

  // 4. Bank Jago Transfer Out / Transfer In
  // e.g. "Transfer out to RICHIE CHOW (Bank Jago)", "Transfer ke QISTHI LARASATI (SeaBank)"
  const jagoTrfOutMatch = text.match(/Transfer\s+(?:out\s+to|ke)\s+([^(]+?)(?:\s*\(([^)]+)\))?$/i);
  if (jagoTrfOutMatch && (text.toLowerCase().includes('transfer out') || text.toLowerCase().includes('transfer ke'))) {
    const name = cleanName(jagoTrfOutMatch[1]);
    const bank = jagoTrfOutMatch[2] ? cleanBankName(jagoTrfOutMatch[2]) : 'Bank';
    return {
      title: name || 'Transfer Keluar',
      subtitle: `Transfer ke ${bank}`,
      raw: text,
    };
  }

  // e.g. "Transfer in from DYLAN PRANOTO (Bank Mandiri)", "Transfer dari ANDREAS TAMARA (Bank Jago)"
  const jagoTrfInMatch = text.match(/Transfer\s+(?:in\s+from|dari)\s+([^(]+?)(?:\s*\(([^)]+)\))?$/i);
  if (jagoTrfInMatch && (text.toLowerCase().includes('transfer in') || text.toLowerCase().includes('transfer dari'))) {
    const name = cleanName(jagoTrfInMatch[1]);
    const bank = jagoTrfInMatch[2] ? cleanBankName(jagoTrfInMatch[2]) : 'Bank';
    return {
      title: name || 'Transfer Masuk',
      subtitle: `Transfer Masuk dari ${bank}`,
      raw: text,
    };
  }

  // 5. Bank Jago Pocket Transfer (Money Out / Money In)
  // e.g. "Money out to Kantong Belanja", "Money in from Utama"
  const jagoPocketMatch = text.match(/(?:Money\s+(?:out\s+to|in\s+from)|Transfer\s+(?:to|from))\s+([A-Za-z0-9\s]+)/i);
  if (jagoPocketMatch && (text.toLowerCase().includes('kantong') || text.toLowerCase().includes('money out') || text.toLowerCase().includes('money in'))) {
    return {
      title: cleanName(jagoPocketMatch[1]),
      subtitle: 'Pemindahbukuan Kantong Jago',
      raw: text,
    };
  }

  // 6. Bank Jago Top Up E-Wallet
  // e.g. "Top up GoPay 081234567890", "Top up OVO 081234567890"
  const jagoTopUpMatch = text.match(/Top\s+up\s+([A-Za-z0-9\s]+?)(?:\s+\d{8,})?$/i);
  if (jagoTopUpMatch) {
    return {
      title: `Top Up ${cleanName(jagoTopUpMatch[1])}`,
      subtitle: 'Top Up E-Wallet',
      raw: text,
    };
  }

  // 7. QRIS Payment (Permata & Jago)
  // e.g. "QR PAYMENT 14:45:34 Kopi Calf To GoCeger Bin TANGSEL Rp 18,000.00"
  // e.g. "QRIS payment to KOPI SOE BINTARO", "Pembayaran QRIS Kopi Calf"
  const jagoQrMatch = text.match(/(?:QRIS\s+payment\s+to|Pembayaran\s+QRIS)\s+(.+)/i);
  if (jagoQrMatch) {
    return {
      title: cleanName(jagoQrMatch[1]) || 'Pembayaran QRIS',
      subtitle: 'Pembayaran QRIS',
      raw: text,
    };
  }

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
