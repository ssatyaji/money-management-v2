import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scan Struk',
};

export default function ScanReceiptPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scan & Import</h1>
        <p className="text-muted-foreground mt-1">Scan struk belanja atau import e-statement bank</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <div className="text-4xl mb-3">📸</div>
        <p className="font-medium">Segera Hadir</p>
        <p className="text-sm text-muted-foreground mt-1">
          Fitur OCR dan import bank statement akan tersedia di Phase 6
        </p>
      </div>
    </div>
  );
}
