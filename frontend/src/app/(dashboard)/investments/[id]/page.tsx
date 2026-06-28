'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber } from '@/lib/utils/currency';
import {
  useInvestmentAssetDetail,
  useAddInvestmentTransaction,
  useUpdateInvestmentAsset,
} from '@/hooks/use-investments';

const ASSET_TYPE_LABELS: Record<string, string> = {
  STOCK: 'Saham', GOLD: 'Emas', CRYPTO: 'Crypto', MUTUAL_FUND: 'Reksa Dana',
  BOND: 'Obligasi', DEPOSIT: 'Deposito', PROPERTY: 'Properti', OTHER: 'Lainnya',
};

const TX_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  BUY: { label: 'Beli', icon: 'add_circle', color: 'text-emerald-600' },
  SELL: { label: 'Jual', icon: 'remove_circle', color: 'text-red-600' },
  DIVIDEND: { label: 'Dividen', icon: 'payments', color: 'text-blue-600' },
};

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: asset, isLoading } = useInvestmentAssetDetail(id);
  const txMutation = useAddInvestmentTransaction();
  const updateMutation = useUpdateInvestmentAsset();
  const [showAddTx, setShowAddTx] = useState(false);
  const [showUpdatePrice, setShowUpdatePrice] = useState(false);
  const [txForm, setTxForm] = useState({ type: 'BUY', units: '', pricePerUnit: '', fee: '', note: '' });
  const [priceForm, setPriceForm] = useState('');

  const handleAddTx = async () => {
    if (!txForm.units || !txForm.pricePerUnit) {
      toast.error('Isi jumlah unit dan harga');
      return;
    }
    try {
      await txMutation.mutateAsync({
        assetId: id,
        data: {
          type: txForm.type as 'BUY' | 'SELL' | 'DIVIDEND',
          units: Number(txForm.units),
          pricePerUnit: Number(txForm.pricePerUnit),
          fee: txForm.fee ? Number(txForm.fee) : undefined,
          note: txForm.note || undefined,
        },
      });
      toast.success('Transaksi berhasil dicatat! 📊');
      setShowAddTx(false);
      setTxForm({ type: 'BUY', units: '', pricePerUnit: '', fee: '', note: '' });
    } catch {
      toast.error('Gagal mencatat transaksi');
    }
  };

  const handleUpdatePrice = async () => {
    if (!priceForm) {
      toast.error('Isi harga terkini');
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id,
        data: { currentPrice: Number(priceForm) },
      });
      toast.success('Harga berhasil diperbarui! ✅');
      setShowUpdatePrice(false);
      setPriceForm('');
    } catch {
      toast.error('Gagal memperbarui harga');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="w-48 h-8" />
        <Skeleton className="w-full h-40" />
        <Skeleton className="w-full h-60" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Aset tidak ditemukan</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/investments')}>Kembali</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <button
        onClick={() => router.push('/investments')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Kembali
      </button>

      {/* Asset Header */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[0px_4px_12px_rgba(26,43,60,0.05)]">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shrink-0" style={{ backgroundColor: `${asset.color}20` }}>
              {asset.icon || '📈'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold">{asset.name}</h1>
                {asset.ticker && (
                  <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground font-mono">{asset.ticker}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{ASSET_TYPE_LABELS[asset.assetType]}</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="rounded-full gap-1 text-xs flex-1 sm:flex-none justify-center" onClick={() => { setPriceForm(String(asset.currentPrice)); setShowUpdatePrice(true); }}>
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Update Harga
            </Button>
            <Button className="rounded-full gap-1 text-xs flex-1 sm:flex-none justify-center" onClick={() => setShowAddTx(true)}>
              <span className="material-symbols-outlined text-[16px]">add</span>
              Transaksi
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-xl bg-muted/50">
            <p className="text-xs text-muted-foreground">Nilai Saat Ini</p>
            <p className="text-lg font-bold mt-1">{formatCurrency(asset.currentValue)}</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/50">
            <p className="text-xs text-muted-foreground">Total Investasi</p>
            <p className="text-lg font-bold mt-1">{formatCurrency(asset.totalInvested)}</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/50">
            <p className="text-xs text-muted-foreground">Gain/Loss</p>
            <p className={cn('text-lg font-bold mt-1', asset.gainLoss >= 0 ? 'text-emerald-600' : 'text-red-600')}>
              {asset.gainLoss >= 0 ? '+' : ''}{formatCurrency(asset.gainLoss)} ({asset.gainLossPercent >= 0 ? '+' : ''}{asset.gainLossPercent}%)
            </p>
          </div>
          <div className="p-3 rounded-xl bg-muted/50">
            <p className="text-xs text-muted-foreground">Jumlah Unit</p>
            <p className="text-lg font-bold mt-1">{asset.totalUnits}</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/50">
            <p className="text-xs text-muted-foreground">Avg Buy Price</p>
            <p className="text-lg font-bold mt-1">{formatCurrency(asset.avgBuyPrice)}</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/50">
            <p className="text-xs text-muted-foreground">Harga Saat Ini</p>
            <p className="text-lg font-bold mt-1">{formatCurrency(asset.currentPrice)}</p>
            <p className="text-[10px] text-muted-foreground">
              Update: {new Date(asset.currentPriceDate).toLocaleDateString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="rounded-2xl border border-border bg-card shadow-[0px_4px_12px_rgba(26,43,60,0.05)]">
        <div className="p-6 pb-4 border-b border-border/50">
          <h3 className="text-lg font-bold">Riwayat Transaksi</h3>
        </div>
        <div className="p-2">
          {!asset.transactions || asset.transactions.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-2xl text-muted-foreground">history</span>
              </div>
              <p className="text-muted-foreground text-sm">Belum ada transaksi</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {asset.transactions.map((tx) => {
                const config = TX_TYPE_CONFIG[tx.type] || TX_TYPE_CONFIG.BUY;
                return (
                  <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-xl transition-all">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center',
                        tx.type === 'BUY' ? 'bg-emerald-500/10' : tx.type === 'SELL' ? 'bg-red-500/10' : 'bg-blue-500/10'
                      )}>
                        <span className={cn('material-symbols-outlined text-[18px]', config.color)}>{config.icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{config.label} {tx.units} unit @ {formatCurrency(tx.pricePerUnit)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {tx.note && ` • ${tx.note}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn('text-sm font-bold', config.color)}>
                        {tx.type === 'SELL' ? '-' : '+'}{formatCurrency(tx.totalAmount)}
                      </span>
                      {tx.fee > 0 && (
                        <p className="text-[10px] text-muted-foreground">Fee: {formatCurrency(tx.fee)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Dialog */}
      <Dialog open={showAddTx} onOpenChange={setShowAddTx}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Transaksi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-2">
              {(['BUY', 'SELL', 'DIVIDEND'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTxForm({ ...txForm, type })}
                  className={cn(
                    'flex items-center justify-center gap-1 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all',
                    txForm.type === type
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50',
                  )}
                >
                  {TX_TYPE_CONFIG[type].label}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Jumlah Unit</Label>
              <Input type="number" step="any" placeholder="100" value={txForm.units}
                onChange={(e) => setTxForm({ ...txForm, units: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Harga per Unit (Rp)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                <Input type="text" placeholder="9500" className="pl-10"
                  value={txForm.pricePerUnit ? formatNumber(Number(txForm.pricePerUnit)) : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setTxForm({ ...txForm, pricePerUnit: raw });
                  }} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fee (opsional)</Label>
              <Input type="number" placeholder="15000" value={txForm.fee}
                onChange={(e) => setTxForm({ ...txForm, fee: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Catatan (opsional)</Label>
              <Input placeholder="Beli saham BBCA" value={txForm.note}
                onChange={(e) => setTxForm({ ...txForm, note: e.target.value })} />
            </div>
            <Button className="w-full" disabled={txMutation.isPending} onClick={handleAddTx}>
              {txMutation.isPending ? 'Menyimpan...' : 'Catat Transaksi'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Price Dialog */}
      <Dialog open={showUpdatePrice} onOpenChange={setShowUpdatePrice}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Harga Terkini</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Harga per Unit (Rp)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                <Input type="text" placeholder="10200" className="pl-10"
                  value={priceForm ? formatNumber(Number(priceForm)) : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setPriceForm(raw);
                  }} />
              </div>
            </div>
            <Button className="w-full" disabled={updateMutation.isPending} onClick={handleUpdatePrice}>
              {updateMutation.isPending ? 'Menyimpan...' : 'Update Harga'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
