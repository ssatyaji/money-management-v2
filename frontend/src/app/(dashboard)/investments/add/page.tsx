'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils/currency';
import { useCreateInvestmentAsset } from '@/hooks/use-investments';
import type { AssetType } from '@/lib/api/investments.api';

const ASSET_TYPES: { value: AssetType; label: string; icon: string }[] = [
  { value: 'STOCK', label: 'Saham', icon: '📊' },
  { value: 'GOLD', label: 'Emas', icon: '🥇' },
  { value: 'CRYPTO', label: 'Crypto', icon: '₿' },
  { value: 'MUTUAL_FUND', label: 'Reksa Dana', icon: '📈' },
  { value: 'BOND', label: 'Obligasi', icon: '📜' },
  { value: 'DEPOSIT', label: 'Deposito', icon: '🏦' },
  { value: 'PROPERTY', label: 'Properti', icon: '🏠' },
  { value: 'OTHER', label: 'Lainnya', icon: '💼' },
];

export default function AddAssetPage() {
  const router = useRouter();
  const createMutation = useCreateInvestmentAsset();

  const [form, setForm] = useState({
    name: '',
    assetType: 'STOCK' as AssetType,
    ticker: '',
    totalUnits: '',
    avgBuyPrice: '',
    currentPrice: '',
  });

  const handleSubmit = async () => {
    if (!form.name || !form.totalUnits || !form.avgBuyPrice || !form.currentPrice) {
      toast.error('Lengkapi semua field yang wajib');
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: form.name,
        assetType: form.assetType,
        totalUnits: Number(form.totalUnits),
        avgBuyPrice: Number(form.avgBuyPrice),
        currentPrice: Number(form.currentPrice),
        ticker: form.ticker || undefined,
      });
      toast.success('Aset berhasil ditambahkan! 📈');
      router.push('/investments');
    } catch {
      toast.error('Gagal menambahkan aset');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => router.push('/investments')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Kembali
      </button>

      <div>
        <h1 className="text-2xl font-bold">Tambah Aset Investasi</h1>
        <p className="text-muted-foreground mt-1">Catat aset investasi baru</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-[0px_4px_12px_rgba(26,43,60,0.05)] space-y-5">
        {/* Asset Type */}
        <div className="space-y-2">
          <Label>Tipe Aset</Label>
          <div className="grid grid-cols-4 gap-2">
            {ASSET_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setForm({ ...form, assetType: type.value })}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-3 rounded-lg border text-xs font-medium transition-all',
                  form.assetType === type.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50',
                )}
              >
                <span className="text-xl">{type.icon}</span>
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label>Nama Aset *</Label>
          <Input placeholder="Contoh: BBCA, Bitcoin, Emas Antam" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>

        {/* Ticker */}
        <div className="space-y-2">
          <Label>Ticker / Kode (opsional)</Label>
          <Input placeholder="Contoh: BBCA.JK, BTC" value={form.ticker}
            onChange={(e) => setForm({ ...form, ticker: e.target.value })} />
        </div>

        {/* Units */}
        <div className="space-y-2">
          <Label>Jumlah Unit/Lot/Gram *</Label>
          <Input type="number" step="any" placeholder="100" value={form.totalUnits}
            onChange={(e) => setForm({ ...form, totalUnits: e.target.value })} />
        </div>

        {/* Avg Buy Price */}
        <div className="space-y-2">
          <Label>Harga Beli Rata-rata (Rp) *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
            <Input type="text" placeholder="9500" className="pl-10"
              value={form.avgBuyPrice ? formatNumber(Number(form.avgBuyPrice)) : ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '');
                setForm({ ...form, avgBuyPrice: raw });
              }} />
          </div>
        </div>

        {/* Current Price */}
        <div className="space-y-2">
          <Label>Harga Saat Ini (Rp) *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
            <Input type="text" placeholder="10200" className="pl-10"
              value={form.currentPrice ? formatNumber(Number(form.currentPrice)) : ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '');
                setForm({ ...form, currentPrice: raw });
              }} />
          </div>
        </div>

        {/* Preview */}
        {form.totalUnits && form.avgBuyPrice && form.currentPrice && (
          <div className="p-4 rounded-xl bg-muted/50 border border-border/50 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preview</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Total Investasi:</span>
                <span className="font-bold ml-2">{formatNumber(Number(form.totalUnits) * Number(form.avgBuyPrice))}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Nilai Saat Ini:</span>
                <span className="font-bold ml-2">{formatNumber(Number(form.totalUnits) * Number(form.currentPrice))}</span>
              </div>
            </div>
          </div>
        )}

        <Button className="w-full" size="lg" disabled={createMutation.isPending} onClick={handleSubmit}>
          {createMutation.isPending ? 'Menyimpan...' : 'Tambah Aset'}
        </Button>
      </div>
    </div>
  );
}
