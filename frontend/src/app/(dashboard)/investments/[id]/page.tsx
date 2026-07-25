'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber } from '@/lib/utils/currency';
import {
  useInvestmentAssetDetail,
  useAddInvestmentTransaction,
  useUpdateInvestmentTransaction,
  useDeleteInvestmentTransaction,
  useUpdateInvestmentAsset,
} from '@/hooks/use-investments';

const ASSET_TYPE_LABELS: Record<string, string> = {
  STOCK: 'Saham',
  GOLD: 'Emas',
  CRYPTO: 'Crypto',
  MUTUAL_FUND: 'Reksa Dana',
  BOND: 'Obligasi',
  DEPOSIT: 'Deposito',
  PROPERTY: 'Properti',
  OTHER: 'Lainnya',
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
  const updateTxMutation = useUpdateInvestmentTransaction();
  const deleteTxMutation = useDeleteInvestmentTransaction();
  const updateAssetMutation = useUpdateInvestmentAsset();

  const [showAddTx, setShowAddTx] = useState(false);
  const [showUpdatePrice, setShowUpdatePrice] = useState(false);
  const [showDeleteTxDialog, setShowDeleteTxDialog] = useState(false);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  const [editingTx, setEditingTx] = useState<{
    id: string;
    type: 'BUY' | 'SELL' | 'DIVIDEND';
    units: string;
    pricePerUnit: string;
    fee: string;
    note: string;
    date: string;
  } | null>(null);

  const [txForm, setTxForm] = useState({
    type: 'BUY',
    units: '',
    pricePerUnit: '',
    fee: '',
    note: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const [priceForm, setPriceForm] = useState('');

  const handleAddTx = async () => {
    if (!txForm.units || !txForm.pricePerUnit) {
      toast.error('Isi jumlah unit dan harga per unit');
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
          date: txForm.date ? new Date(txForm.date).toISOString() : undefined,
        },
      });
      toast.success('Transaksi berhasil dicatat! 📊');
      setShowAddTx(false);
      setTxForm({
        type: 'BUY',
        units: '',
        pricePerUnit: '',
        fee: '',
        note: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      });
    } catch {
      toast.error('Gagal mencatat transaksi');
    }
  };

  const handleEditTxSubmit = async () => {
    if (!editingTx || !editingTx.units || !editingTx.pricePerUnit) {
      toast.error('Isi jumlah unit dan harga per unit');
      return;
    }
    try {
      await updateTxMutation.mutateAsync({
        assetId: id,
        txId: editingTx.id,
        data: {
          type: editingTx.type,
          units: Number(editingTx.units),
          pricePerUnit: Number(editingTx.pricePerUnit),
          fee: editingTx.fee ? Number(editingTx.fee) : undefined,
          note: editingTx.note || undefined,
          date: editingTx.date ? new Date(editingTx.date).toISOString() : undefined,
        },
      });
      toast.success('Transaksi berhasil diperbarui! ✏️');
      setEditingTx(null);
    } catch {
      toast.error('Gagal memperbarui transaksi');
    }
  };

  const handleDeleteTxConfirm = async () => {
    if (!deletingTxId) return;
    try {
      await deleteTxMutation.mutateAsync({
        assetId: id,
        txId: deletingTxId,
      });
      toast.success('Transaksi berhasil dihapus 🗑️');
      setDeletingTxId(null);
      setShowDeleteTxDialog(false);
    } catch {
      toast.error('Gagal menghapus transaksi');
    }
  };

  const handleUpdatePrice = async () => {
    if (!priceForm) {
      toast.error('Isi harga terkini');
      return;
    }
    try {
      await updateAssetMutation.mutateAsync({
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
        <Button variant="outline" className="mt-4" onClick={() => router.push('/investments')}>
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <button
        onClick={() => router.push('/investments')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Kembali
      </button>

      {/* Asset Header */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[0px_4px_12px_rgba(26,43,60,0.05)]">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shrink-0"
              style={{ backgroundColor: `${asset.color}20` }}
            >
              {asset.icon || '📈'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold">{asset.name}</h1>
                {asset.ticker && (
                  <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground font-mono">
                    {asset.ticker}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{ASSET_TYPE_LABELS[asset.assetType]}</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="rounded-full gap-1 text-xs flex-1 sm:flex-none justify-center cursor-pointer"
              onClick={() => {
                setPriceForm(String(asset.currentPrice));
                setShowUpdatePrice(true);
              }}
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Update Harga
            </Button>
            <Button
              className="rounded-full gap-1 text-xs flex-1 sm:flex-none justify-center cursor-pointer"
              onClick={() => setShowAddTx(true)}
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Catat Transaksi
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
            <p
              className={cn(
                'text-lg font-bold mt-1',
                asset.gainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'
              )}
            >
              {asset.gainLoss >= 0 ? '+' : ''}
              {formatCurrency(asset.gainLoss)} ({asset.gainLossPercent >= 0 ? '+' : ''}
              {asset.gainLossPercent}%)
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

      {/* Transaction History List */}
      <div className="rounded-2xl border border-border bg-card shadow-[0px_4px_12px_rgba(26,43,60,0.05)]">
        <div className="p-6 pb-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="text-lg font-bold">Riwayat Transaksi</h3>
          <span className="text-xs text-muted-foreground font-medium">
            {asset.transactions?.length || 0} Item
          </span>
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
            <div className="flex flex-col divide-y divide-border/40">
              {asset.transactions.map((tx) => {
                const config = TX_TYPE_CONFIG[tx.type] || TX_TYPE_CONFIG.BUY;
                return (
                  <div
                    key={tx.id}
                    className="group flex items-center justify-between p-4 hover:bg-muted/50 rounded-xl transition-all gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                          tx.type === 'BUY'
                            ? 'bg-emerald-500/10'
                            : tx.type === 'SELL'
                            ? 'bg-red-500/10'
                            : 'bg-blue-500/10'
                        )}
                      >
                        <span className={cn('material-symbols-outlined text-[18px]', config.color)}>
                          {config.icon}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate text-foreground">
                          {config.label} {tx.units} unit @ {formatCurrency(tx.pricePerUnit)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(tx.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                          {tx.note && ` • ${tx.note}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className={cn('text-sm font-bold', config.color)}>
                          {tx.type === 'SELL' ? '-' : '+'}{formatCurrency(tx.totalAmount)}
                        </span>
                        {tx.fee > 0 && (
                          <p className="text-[10px] text-muted-foreground">Fee: {formatCurrency(tx.fee)}</p>
                        )}
                      </div>

                      {/* Action buttons (Edit & Delete) */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          title="Edit transaksi"
                          onClick={() =>
                            setEditingTx({
                              id: tx.id,
                              type: tx.type,
                              units: String(tx.units),
                              pricePerUnit: String(tx.pricePerUnit),
                              fee: tx.fee ? String(tx.fee) : '',
                              note: tx.note || '',
                              date: format(new Date(tx.date), 'yyyy-MM-dd'),
                            })
                          }
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Hapus transaksi"
                          onClick={() => {
                            setDeletingTxId(tx.id);
                            setShowDeleteTxDialog(true);
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Dialog 1: Add Transaction ───────────────────────────── */}
      <Dialog open={showAddTx} onOpenChange={setShowAddTx}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Transaksi Aset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-2">
              {(['BUY', 'SELL', 'DIVIDEND'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTxForm({ ...txForm, type })}
                  className={cn(
                    'flex items-center justify-center gap-1 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer',
                    txForm.type === type
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  )}
                >
                  {TX_TYPE_CONFIG[type].label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Tanggal Transaksi</Label>
              <Input
                type="date"
                value={txForm.date}
                onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                className="cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <Label>Jumlah Unit</Label>
              <Input
                type="number"
                step="any"
                placeholder="100"
                value={txForm.units}
                onChange={(e) => setTxForm({ ...txForm, units: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Harga per Unit (Rp)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">
                  Rp
                </span>
                <Input
                  type="text"
                  placeholder="9500"
                  className="pl-10 font-medium"
                  value={txForm.pricePerUnit ? formatNumber(Number(txForm.pricePerUnit)) : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setTxForm({ ...txForm, pricePerUnit: raw });
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fee (Opsional)</Label>
              <Input
                type="number"
                placeholder="15000"
                value={txForm.fee}
                onChange={(e) => setTxForm({ ...txForm, fee: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <Input
                placeholder="Beli saham BBCA / Dividen Semester 1"
                value={txForm.note}
                onChange={(e) => setTxForm({ ...txForm, note: e.target.value })}
              />
            </div>

            <Button className="w-full font-bold cursor-pointer" disabled={txMutation.isPending} onClick={handleAddTx}>
              {txMutation.isPending ? 'Menyimpan...' : 'Simpan Transaksi'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog 2: Edit Transaction ──────────────────────────── */}
      <Dialog open={!!editingTx} onOpenChange={(open) => !open && setEditingTx(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaksi Aset</DialogTitle>
          </DialogHeader>
          {editingTx && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-3 gap-2">
                {(['BUY', 'SELL', 'DIVIDEND'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEditingTx({ ...editingTx, type })}
                    className={cn(
                      'flex items-center justify-center gap-1 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer',
                      editingTx.type === type
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    )}
                  >
                    {TX_TYPE_CONFIG[type].label}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Tanggal Transaksi</Label>
                <Input
                  type="date"
                  value={editingTx.date}
                  onChange={(e) => setEditingTx({ ...editingTx, date: e.target.value })}
                  className="cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <Label>Jumlah Unit</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="100"
                  value={editingTx.units}
                  onChange={(e) => setEditingTx({ ...editingTx, units: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Harga per Unit (Rp)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">
                    Rp
                  </span>
                  <Input
                    type="text"
                    placeholder="9500"
                    className="pl-10 font-medium"
                    value={editingTx.pricePerUnit ? formatNumber(Number(editingTx.pricePerUnit)) : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      setEditingTx({ ...editingTx, pricePerUnit: raw });
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fee (Opsional)</Label>
                <Input
                  type="number"
                  placeholder="15000"
                  value={editingTx.fee}
                  onChange={(e) => setEditingTx({ ...editingTx, fee: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Catatan (Opsional)</Label>
                <Input
                  placeholder="Catatan transaksi..."
                  value={editingTx.note}
                  onChange={(e) => setEditingTx({ ...editingTx, note: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingTx(null)}
                  disabled={updateTxMutation.isPending}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  className="flex-1 font-bold cursor-pointer"
                  disabled={updateTxMutation.isPending}
                  onClick={handleEditTxSubmit}
                >
                  {updateTxMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog 3: Update Asset Live Price ───────────────────── */}
      <Dialog open={showUpdatePrice} onOpenChange={setShowUpdatePrice}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Harga Terkini</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Harga per Unit (Rp)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">
                  Rp
                </span>
                <Input
                  type="text"
                  placeholder="10200"
                  className="pl-10 font-medium"
                  value={priceForm ? formatNumber(Number(priceForm)) : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setPriceForm(raw);
                  }}
                />
              </div>
            </div>
            <Button className="w-full font-bold cursor-pointer" disabled={updateAssetMutation.isPending} onClick={handleUpdatePrice}>
              {updateAssetMutation.isPending ? 'Menyimpan...' : 'Update Harga'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog 4: Delete Transaction Confirmation ──────────── */}
      <Dialog open={showDeleteTxDialog} onOpenChange={setShowDeleteTxDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Transaksi Aset</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus riwayat transaksi aset ini? Total unit dan modal investasi akan dihitung ulang secara otomatis.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteTxDialog(false);
                setDeletingTxId(null);
              }}
              disabled={deleteTxMutation.isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTxConfirm}
              disabled={deleteTxMutation.isPending}
            >
              {deleteTxMutation.isPending ? 'Menghapus...' : 'Hapus Transaksi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
