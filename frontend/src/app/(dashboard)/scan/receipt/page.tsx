'use client';

import { useState, useCallback, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { useUploadReceipt } from '@/hooks/use-ocr';
import {
  useBankStatements,
  useUploadStatement,
  useParsedTransactions,
  useImportTransactions,
} from '@/hooks/use-bank-statements';
import type {
  BankName,
  ParsedReceipt,
  ParsedTransaction,
  BankStatement,
  BANK_LABELS as BankLabelsType,
} from '@/types/bank-statement.types';

const BANK_LABELS: Record<BankName, string> = {
  PERMATA: 'Bank Permata',
  JAGO: 'Bank Jago',
  SEABANK: 'SeaBank',
  BCA: 'Bank BCA',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: 'Menunggu', color: 'bg-yellow-500/20 text-yellow-400', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  PROCESSING: { label: 'Memproses', color: 'bg-blue-500/20 text-blue-400', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  COMPLETED: { label: 'Selesai', color: 'bg-emerald-500/20 text-emerald-400', icon: <CheckCircle2 className="h-3 w-3" /> },
  FAILED: { label: 'Gagal', color: 'bg-red-500/20 text-red-400', icon: <XCircle className="h-3 w-3" /> },
};

// ─── OCR Tab Component ──────────────────────────────────────────────────────

function ScanReceiptTab() {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<ParsedReceipt | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadReceipt();

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB');
      return;
    }
    setSelectedFile(file);
    setOcrResult(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleProcess = () => {
    if (!selectedFile) return;

    uploadMutation.mutate(
      { file: selectedFile },
      {
        onSuccess: (data) => {
          setOcrResult(data.result);
          toast.success('Struk berhasil diproses!');
        },
        onError: () => {
          toast.error('Gagal memproses struk. Pastikan gambar jelas.');
        },
      },
    );
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setOcrResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Viewfinder Area */}
      <div className="space-y-4">
        <div
          className={cn(
            'relative overflow-hidden rounded-3xl transition-all duration-300',
            'flex flex-col items-center justify-center w-full min-h-[480px] bg-black text-white shadow-xl',
            dragActive && 'border-4 border-emerald-500'
          )}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          {uploadMutation.isPending && (
            <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
              {/* Scanning animation line */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)] animate-scan-line" />
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin mb-4" />
              <p className="text-white font-medium animate-pulse">Menganalisis Struk...</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Preview struk"
                className="absolute inset-0 w-full h-full object-cover opacity-90"
              />
              <div className="absolute bottom-6 left-0 w-full px-6 flex justify-between items-center z-10">
                <Button
                  variant="secondary"
                  size="icon"
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30"
                  onClick={(e) => { e.stopPropagation(); handleClear(); }}
                >
                  <span className="material-symbols-outlined">close</span>
                </Button>
                <Button
                  size="lg"
                  onClick={(e) => { e.stopPropagation(); handleProcess(); }}
                  disabled={uploadMutation.isPending}
                  className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg px-8 h-12 font-semibold"
                >
                  <span className="material-symbols-outlined mr-2">document_scanner</span>
                  Proses OCR
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Corner brackets */}
              <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-white/50 rounded-tl-xl" />
              <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-white/50 rounded-tr-xl" />
              <div className="absolute bottom-28 left-8 w-12 h-12 border-b-4 border-l-4 border-white/50 rounded-bl-xl" />
              <div className="absolute bottom-28 right-8 w-12 h-12 border-b-4 border-r-4 border-white/50 rounded-br-xl" />

              {/* Top controls */}
              <div className="absolute top-6 w-full px-6 flex justify-between items-center z-10">
                <button className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white/80 hover:text-white transition-colors">
                  <span className="material-symbols-outlined">flash_off</span>
                </button>
                <Badge variant="outline" className="bg-black/40 text-white border-white/20 backdrop-blur-md">
                  Mode Struk
                </Badge>
                <button className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white/80 hover:text-white transition-colors">
                  <span className="material-symbols-outlined">flip_camera_ios</span>
                </button>
              </div>

              {/* Center text */}
              <div className="text-center mt-[-40px]">
                <p className="text-white/80 font-medium tracking-wide">Posisikan struk di dalam kotak</p>
              </div>

              {/* Bottom controls */}
              <div className="absolute bottom-8 w-full px-8 flex justify-center items-center z-10">
                {/* Shutter Button */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full border-[6px] border-white/50 flex items-center justify-center group transition-transform active:scale-95"
                >
                  <div className="w-[60px] h-[60px] rounded-full bg-white group-hover:bg-gray-200 transition-colors" />
                </button>
              </div>
              
              <div className="absolute bottom-10 right-8">
                 <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center text-white border border-white/20 hover:bg-black/60 transition-colors"
                >
                  <span className="material-symbols-outlined">imagesmode</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* OCR Result */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Hasil Scan</h3>

        {uploadMutation.isPending && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
              <span className="text-muted-foreground">Memproses gambar dengan OCR...</span>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        )}

        {ocrResult && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            {/* Merchant & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Merchant</Label>
                <p className="font-medium">{ocrResult.merchant || 'Tidak terdeteksi'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Tanggal</Label>
                <p className="font-medium">{ocrResult.date || 'Tidak terdeteksi'}</p>
              </div>
            </div>

            {/* Items */}
            {ocrResult.items.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Item</Label>
                <div className="space-y-1">
                  {ocrResult.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                      <span>
                        {item.quantity > 1 && <span className="text-muted-foreground">{item.quantity}x </span>}
                        {item.name}
                      </span>
                      <span className="font-mono">{formatCurrency(item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="border-t border-border pt-3 space-y-1">
              {ocrResult.subtotal !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">{formatCurrency(ocrResult.subtotal)}</span>
                </div>
              )}
              {ocrResult.tax !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pajak</span>
                  <span className="font-mono">{formatCurrency(ocrResult.tax)}</span>
                </div>
              )}
              {ocrResult.total !== null && (
                <div className="flex justify-between font-semibold text-base pt-1 border-t border-border">
                  <span>Total</span>
                  <span className="font-mono text-emerald-500">{formatCurrency(ocrResult.total)}</span>
                </div>
              )}
            </div>

            {/* Raw Text Toggle */}
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                Lihat teks mentah OCR
              </summary>
              <pre className="mt-2 p-3 bg-muted/50 rounded-lg text-xs whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                {ocrResult.rawText}
              </pre>
            </details>

            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" disabled>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Simpan sebagai Transaksi (segera hadir)
            </Button>
          </div>
        )}

        {!ocrResult && !uploadMutation.isPending && (
          <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-[0px_4px_12px_rgba(26,43,60,0.05)] h-full flex flex-col items-center justify-center min-h-[480px]">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-emerald-500">receipt_long</span>
            </div>
            <h3 className="font-semibold text-lg text-foreground">Arahkan Kamera ke Struk</h3>
            <p className="text-muted-foreground mt-2 max-w-[250px]">
              Foto struk belanja Anda untuk mengekstrak data transaksi secara otomatis.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Bank Statement Tab Component ───────────────────────────────────────────

function ImportStatementTab() {
  const [selectedBank, setSelectedBank] = useState<BankName | ''>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedStatementId, setUploadedStatementId] = useState<string | null>(null);
  const [selectedTxnIds, setSelectedTxnIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadStatement();
  const importMutation = useImportTransactions();
  const { data: parsedTransactions, isLoading: loadingTransactions } = useParsedTransactions(uploadedStatementId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('File harus berformat PDF');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 20MB');
      return;
    }
    setSelectedFile(file);
    setUploadedStatementId(null);
    setSelectedTxnIds(new Set());
  };

  const handleUpload = () => {
    if (!selectedBank || !selectedFile) {
      toast.error('Pilih bank dan file terlebih dahulu');
      return;
    }

    uploadMutation.mutate(
      { bankName: selectedBank as BankName, file: selectedFile },
      {
        onSuccess: (data) => {
          setUploadedStatementId(data.id);
          toast.success(`${data.transactionCount} transaksi ditemukan!`);
        },
        onError: () => {
          toast.error('Gagal mem-parsing file PDF. Pastikan file valid.');
        },
      },
    );
  };

  const handleToggleAll = () => {
    if (!parsedTransactions) return;
    if (selectedTxnIds.size === parsedTransactions.length) {
      setSelectedTxnIds(new Set());
    } else {
      setSelectedTxnIds(new Set(parsedTransactions.map((t) => t.tempId)));
    }
  };

  const handleToggleTxn = (tempId: string) => {
    setSelectedTxnIds((prev) => {
      const next = new Set(prev);
      if (next.has(tempId)) next.delete(tempId);
      else next.add(tempId);
      return next;
    });
  };

  const handleImport = () => {
    if (!uploadedStatementId || selectedTxnIds.size === 0) return;

    importMutation.mutate(
      {
        statementId: uploadedStatementId,
        transactionIds: Array.from(selectedTxnIds),
      },
      {
        onSuccess: (data) => {
          toast.success(`${data.imported} transaksi berhasil diimport!`);
          setSelectedFile(null);
          setUploadedStatementId(null);
          setSelectedTxnIds(new Set());
          setSelectedBank('');
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
        onError: () => {
          toast.error('Gagal mengimport transaksi');
        },
      },
    );
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadedStatementId(null);
    setSelectedTxnIds(new Set());
    setSelectedBank('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="bank-select">Pilih Bank</Label>
            <Select value={selectedBank} onValueChange={(v) => setSelectedBank(v as BankName)}>
              <SelectTrigger id="bank-select">
                <SelectValue placeholder="Pilih bank..." />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(BANK_LABELS) as [BankName, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pdf-file">File E-Statement (PDF)</Label>
            <Input
              ref={fileInputRef}
              id="pdf-file"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!selectedBank || !selectedFile || uploadMutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {uploadMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Memproses...</>
              ) : (
                <><span className="material-symbols-outlined text-[18px] mr-1">upload</span> Upload & Parse</>
              )}
            </Button>
            {uploadedStatementId && (
              <Button variant="outline" onClick={handleReset}>Reset</Button>
            )}
          </div>
        </div>
      </div>

      {/* Parsed Transactions */}
      {loadingTransactions && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <Skeleton className="h-6 w-48" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {parsedTransactions && parsedTransactions.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">Transaksi Ditemukan</h3>
              <Badge variant="secondary">{parsedTransactions.length} transaksi</Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {selectedTxnIds.size} dipilih
              </span>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={selectedTxnIds.size === 0 || importMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {importMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Importing...</>
                ) : (
                  <><span className="material-symbols-outlined text-[18px] mr-1">download</span> Import ({selectedTxnIds.size})</>
                )}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-3 w-10">
                    <Checkbox
                      checked={selectedTxnIds.size === parsedTransactions.length && parsedTransactions.length > 0}
                      onCheckedChange={handleToggleAll}
                    />
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase">Tanggal</th>
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase">Deskripsi</th>
                  <th className="p-3 text-right text-xs font-medium text-muted-foreground uppercase">Jumlah</th>
                  <th className="p-3 text-center text-xs font-medium text-muted-foreground uppercase">Tipe</th>
                </tr>
              </thead>
              <tbody>
                {parsedTransactions.map((txn) => (
                  <tr
                    key={txn.tempId}
                    className={cn(
                      'border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer',
                      selectedTxnIds.has(txn.tempId) && 'bg-emerald-500/5',
                    )}
                    onClick={() => handleToggleTxn(txn.tempId)}
                  >
                    <td className="p-3">
                      <Checkbox
                        checked={selectedTxnIds.has(txn.tempId)}
                        onCheckedChange={() => handleToggleTxn(txn.tempId)}
                      />
                    </td>
                    <td className="p-3 text-sm whitespace-nowrap">
                      {new Date(txn.date).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="p-3 text-sm max-w-[300px] truncate">{txn.description}</td>
                    <td className="p-3 text-sm text-right font-mono whitespace-nowrap">
                      <span className={txn.type === 'INCOME' ? 'text-emerald-500' : 'text-red-400'}>
                        {txn.type === 'INCOME' ? '+' : '-'}{formatCurrency(txn.amount)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <Badge
                        className={cn(
                          'text-xs',
                          txn.type === 'INCOME'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400',
                        )}
                      >
                        {txn.type === 'INCOME' ? 'Masuk' : 'Keluar'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {parsedTransactions && parsedTransactions.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-muted-foreground/50 mb-3 block">description</span>
          <p className="font-medium">Tidak ada transaksi ditemukan</p>
          <p className="text-sm text-muted-foreground mt-1">
            PDF mungkin tidak mengandung data transaksi yang dapat diparse.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── History Tab Component ──────────────────────────────────────────────────

function UploadHistoryTab() {
  const { data: statements, isLoading } = useBankStatements();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!statements || statements.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <span className="material-symbols-outlined text-4xl text-muted-foreground/50 mb-3 block">history</span>
        <p className="font-medium">Belum ada riwayat upload</p>
        <p className="text-sm text-muted-foreground mt-1">
          Upload struk atau e-statement bank untuk mulai.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {statements.map((stmt: BankStatement) => {
        const statusConfig = STATUS_CONFIG[stmt.status] || STATUS_CONFIG.PENDING;

        return (
          <div
            key={stmt.id}
            className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 hover:bg-muted/20 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[20px] text-muted-foreground">description</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{stmt.fileName}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {BANK_LABELS[stmt.bankName] || stmt.bankName}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(stmt.createdAt).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {stmt._count && stmt._count.transactions > 0 && (
                <span className="text-xs text-muted-foreground">
                  {stmt._count.transactions} transaksi
                </span>
              )}
              <Badge className={cn('text-xs gap-1', statusConfig.color)}>
                {statusConfig.icon}
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ScanReceiptPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scan & Import</h1>
        <p className="text-muted-foreground mt-1">
          Scan struk belanja atau import e-statement bank
        </p>
      </div>

      <Tabs defaultValue="scan" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="scan" className="gap-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <span className="material-symbols-outlined text-[18px]">camera</span>
            Scan Struk
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            Import PDF
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <span className="material-symbols-outlined text-[18px]">history</span>
            Riwayat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scan">
          <ScanReceiptTab />
        </TabsContent>

        <TabsContent value="import">
          <ImportStatementTab />
        </TabsContent>

        <TabsContent value="history">
          <UploadHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
