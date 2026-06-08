import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pengaturan',
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground mt-1">Konfigurasi profil dan preferensi</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <div className="text-4xl mb-3">⚙️</div>
        <p className="font-medium">Segera Hadir</p>
        <p className="text-sm text-muted-foreground mt-1">
          Fitur pengaturan akan tersedia di Phase 7
        </p>
      </div>
    </div>
  );
}
