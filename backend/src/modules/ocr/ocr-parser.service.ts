import { Injectable, Logger } from '@nestjs/common';

export interface ParsedReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export interface ParsedReceipt {
  merchant: string | null;
  date: string | null;
  items: ParsedReceiptItem[];
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  rawText: string;
}

@Injectable()
export class OcrParserService {
  private readonly logger = new Logger(OcrParserService.name);

  /**
   * Parse raw OCR text from a receipt into structured data.
   * Uses regex patterns common in Indonesian receipts.
   */
  parseReceiptText(rawText: string): ParsedReceipt {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

    return {
      merchant: this.extractMerchant(lines),
      date: this.extractDate(rawText),
      items: this.extractItems(lines),
      subtotal: this.extractAmount(rawText, /sub\s*total\s*[:\s]*(?:rp\.?\s*)?([0-9.,]+)/i),
      tax: this.extractAmount(rawText, /(?:tax|pajak|ppn)\s*[:\s]*(?:rp\.?\s*)?([0-9.,]+)/i),
      total: this.extractTotal(rawText),
      rawText,
    };
  }

  private extractMerchant(lines: string[]): string | null {
    // The merchant name is typically one of the first non-empty lines
    // Skip very short lines (likely noise) and lines that look like dates/numbers
    for (const line of lines.slice(0, 5)) {
      const cleaned = line.replace(/[^a-zA-Z0-9\s&.'-]/g, '').trim();
      if (cleaned.length >= 3 && !/^\d+$/.test(cleaned)) {
        return cleaned;
      }
    }
    return null;
  }

  private extractDate(text: string): string | null {
    // Common date formats in Indonesian receipts
    const patterns = [
      // DD/MM/YYYY or DD-MM-YYYY
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
      // DD/MM/YY or DD-MM-YY
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})\b/,
      // DD MMM YYYY (e.g., 15 Jan 2026)
      /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i,
      // YYYY-MM-DD (ISO)
      /(\d{4})-(\d{2})-(\d{2})/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return null;
  }

  private extractItems(lines: string[]): ParsedReceiptItem[] {
    const items: ParsedReceiptItem[] = [];

    // Pattern: item name followed by price (with possible quantity)
    // Examples:
    //   "Nasi Goreng    25.000"
    //   "2 x Kopi       15.000"
    //   "Ayam Bakar  Rp 35,000"
    const itemPattern = /^(.+?)\s+(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)\s*$/i;
    const qtyPattern = /^(\d+)\s*[xX×]\s*(.+)/;

    for (const line of lines) {
      const match = line.match(itemPattern);
      if (match) {
        let name = match[1].trim();
        const priceStr = match[2];

        // Skip lines that are likely subtotal/total/tax
        if (/(?:total|subtotal|sub total|pajak|tax|ppn|tunai|cash|kembalian|change|diskon|discount)/i.test(name)) {
          continue;
        }

        let quantity = 1;
        const qtyMatch = name.match(qtyPattern);
        if (qtyMatch) {
          quantity = parseInt(qtyMatch[1], 10);
          name = qtyMatch[2].trim();
        }

        const price = this.parsePrice(priceStr);
        if (price > 0 && name.length >= 2) {
          items.push({ name, quantity, price });
        }
      }
    }

    return items;
  }

  private extractTotal(text: string): number | null {
    // Try various total patterns (most specific first)
    const patterns = [
      /(?:grand\s*total|total\s*(?:bayar|pembayaran|belanja|harga))\s*[:\s]*(?:rp\.?\s*)?([0-9.,]+)/i,
      /total\s*[:\s]*(?:rp\.?\s*)?([0-9.,]+)/i,
    ];

    for (const pattern of patterns) {
      const amount = this.extractAmount(text, pattern);
      if (amount !== null) {
        return amount;
      }
    }
    return null;
  }

  private extractAmount(text: string, pattern: RegExp): number | null {
    const match = text.match(pattern);
    if (match && match[1]) {
      return this.parsePrice(match[1]);
    }
    return null;
  }

  private parsePrice(priceStr: string): number {
    // Handle Indonesian price format: "25.000" or "25,000" or "25000"
    // Remove all dots and commas except the last one if it's a decimal separator
    let cleaned = priceStr.replace(/\s/g, '');

    // If format is like "25.000" (thousand separator with dot), remove dots
    if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
      cleaned = cleaned.replace(/\./g, '');
    }
    // If format is like "25,000" (thousand separator with comma), remove commas
    else if (/^\d{1,3}(,\d{3})+$/.test(cleaned)) {
      cleaned = cleaned.replace(/,/g, '');
    }
    // If format has decimal: "25.000,50" or "25,000.50"
    else {
      cleaned = cleaned.replace(/[.,](?=\d{3})/g, '');
      cleaned = cleaned.replace(',', '.');
    }

    const value = parseFloat(cleaned);
    return isNaN(value) ? 0 : value;
  }
}
