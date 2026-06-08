import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reminder',
};

export default function RemindersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reminder</h1>
        <p className="text-muted-foreground mt-1">Pengingat tagihan dan pembayaran</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <div className="text-4xl mb-3">🔔</div>
        <p className="font-medium">Segera Hadir</p>
        <p className="text-sm text-muted-foreground mt-1">
          Fitur reminder akan tersedia di Phase 5
        </p>
      </div>
    </div>
  );
}
