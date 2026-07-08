'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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
import { useUploadReceipt, useOcrReceipts } from '@/hooks/use-ocr';
import { useCategories, useCreateTransaction } from '@/hooks/use-transactions';
import { useAccounts } from '@/hooks/use-accounts';
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
  OcrReceipt,
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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Form edit states
  const [editMerchant, setEditMerchant] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editAccount, setEditAccount] = useState('main');
  const [editNote, setEditNote] = useState('');

  const uploadMutation = useUploadReceipt();
  const createTxnMutation = useCreateTransaction();
  const { data: categories = [] } = useCategories('EXPENSE');
  const { data: accounts = [] } = useAccounts();

  // Populate form fields on successful OCR
  useEffect(() => {
    if (ocrResult) {
      setEditMerchant(ocrResult.merchant || '');
      setEditAmount(ocrResult.total ? String(ocrResult.total) : '0');
      
      // Attempt to parse/format date from OCR
      let formattedDate = new Date().toISOString().split('T')[0];
      if (ocrResult.date) {
        const parts = ocrResult.date.split(/[/-]/);
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            formattedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          } else if (parts[2].length === 4) {
            formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
      }
      setEditDate(formattedDate);
    }
  }, [ocrResult]);

  // Set default category when loaded
  useEffect(() => {
    const defaultCat = categories.find(c => c.isDefault) || categories[0];
    if (defaultCat && !editCategory) {
      setEditCategory(defaultCat.id);
    }
  }, [categories, editCategory]);

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
          toast.success('Struk berhasil diproses! Silakan review detail transaksi.');
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
    setEditMerchant('');
    setEditAmount('');
    setEditNote('');
    setEditCategory(categories[0]?.id || '');
    setEditAccount('main');
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleSaveTransaction = () => {
    if (!editMerchant.trim()) {
      toast.error('Merchant / deskripsi wajib diisi');
      return;
    }
    const cleanAmount = Number(editAmount.replace(/[^0-9]/g, ''));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      toast.error('Jumlah transaksi harus lebih dari 0');
      return;
    }
    if (!editCategory) {
      toast.error('Pilih kategori terlebih dahulu');
      return;
    }

    // Construct local date time to prevent day shifting and default to current hour/minute
    const [year, month, day] = editDate.split('-').map(Number);
    const txnDate = new Date();
    txnDate.setFullYear(year, month - 1, day);

    createTxnMutation.mutate({
      type: 'EXPENSE',
      amount: cleanAmount,
      description: editMerchant.trim(),
      date: txnDate.toISOString(),
      categoryId: editCategory,
      accountId: editAccount === 'main' ? undefined : editAccount,
      note: editNote.trim() || undefined,
    }, {
      onSuccess: () => {
        toast.success('Transaksi OCR berhasil disimpan! 🎉');
        handleClear();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error?.message || 'Gagal menyimpan transaksi struk.');
      }
    });
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

          {/* Camera input: capture="environment" forces the device camera */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {/* Gallery input: no capture attribute, opens photo gallery / file picker */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
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
              <div className="absolute bottom-6 left-0 w-full px-8 flex justify-between items-center z-10 gap-4">
                {/* Placeholder to balance the gallery button on the right */}
                <div className="w-12 text-transparent select-none pointer-events-none">_</div>

                {/* Shutter Button */}
                <button 
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-[6px] border-white/50 flex items-center justify-center group transition-transform active:scale-95 shrink-0"
                >
                  <div className="w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] rounded-full bg-white group-hover:bg-gray-200 transition-colors" />
                </button>

                {/* Gallery Button */}
                <button 
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center text-white border border-white/20 hover:bg-black/60 transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined">imagesmode</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* OCR Result and Edit Form */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Hasil Scan & Review</h3>

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
          <div className="rounded-xl border border-border bg-card p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Merchant */}
            <div className="space-y-2">
              <Label htmlFor="ocr-merchant">Merchant / Deskripsi</Label>
              <Input
                id="ocr-merchant"
                value={editMerchant}
                onChange={(e) => setEditMerchant(e.target.value)}
                placeholder="Nama Toko atau Deskripsi"
                className="bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="ocr-amount">Jumlah Total (Rp)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                  <Input
                    id="ocr-amount"
                    value={editAmount ? Number(editAmount.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setEditAmount(val);
                    }}
                    placeholder="0"
                    className="pl-10 bg-background"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="ocr-date">Tanggal</Label>
                <Input
                  id="ocr-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="ocr-category">Kategori</Label>
                <select
                  id="ocr-category"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Wallet/Account */}
              <div className="space-y-2">
                <Label htmlFor="ocr-account">Dompet / Akun</Label>
                <select
                  id="ocr-account"
                  value={editAccount}
                  onChange={(e) => setEditAccount(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="main">Saldo Utama</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="ocr-note">Catatan Tambahan (Opsional)</Label>
              <textarea
                id="ocr-note"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Tambahkan catatan..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            {/* Items display for reference */}
            {ocrResult.items.length > 0 && (
              <div className="border-t border-border pt-3">
                <Label className="text-xs text-muted-foreground mb-2 block">Daftar Item Hasil Scan</Label>
                <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1">
                  {ocrResult.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs py-1 border-b border-border/30 last:border-0">
                      <span className="text-muted-foreground">
                        {item.quantity > 1 && <span>{item.quantity}x </span>}
                        {item.name}
                      </span>
                      <span className="font-mono">{formatCurrency(item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Text Toggle */}
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                Lihat teks mentah OCR
              </summary>
              <pre className="mt-2 p-3 bg-muted/50 rounded-lg text-[10px] whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                {ocrResult.rawText}
              </pre>
            </details>

            <Button 
              onClick={handleSaveTransaction} 
              disabled={createTxnMutation.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg h-12"
            >
              {createTxnMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyimpan...</>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Simpan Transaksi
                </>
              )}
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

  // States for category/wallet mapping
  const [defaultWallet, setDefaultWallet] = useState('main');
  const [rowCategories, setRowCategories] = useState<Record<string, string>>({});
  const [rowAccounts, setRowAccounts] = useState<Record<string, string>>({});

  const uploadMutation = useUploadStatement();
  const importMutation = useImportTransactions();
  const { data: parsedTransactions, isLoading: loadingTransactions } = useParsedTransactions(uploadedStatementId);
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  // Populate row-level default categories and wallets
  useEffect(() => {
    if (parsedTransactions) {
      const initialCats: Record<string, string> = {};
      const initialAccs: Record<string, string> = {};

      const defaultExpCat = categories.find(c => c.isDefault && c.type === 'EXPENSE') || categories.find(c => c.type === 'EXPENSE') || categories[0];
      const defaultIncCat = categories.find(c => c.isDefault && c.type === 'INCOME') || categories.find(c => c.type === 'INCOME') || categories[0];

      parsedTransactions.forEach((txn) => {
        initialAccs[txn.tempId] = defaultWallet;
        initialCats[txn.tempId] = txn.type === 'INCOME' 
          ? (defaultIncCat?.id || '') 
          : (defaultExpCat?.id || '');
      });

      setRowCategories(prev => ({ ...initialCats, ...prev }));
      setRowAccounts(prev => ({ ...initialAccs, ...prev }));
    }
  }, [parsedTransactions, categories]);

  // Bulk update row wallets when default wallet is changed
  const handleDefaultWalletChange = (walletId: string) => {
    setDefaultWallet(walletId);
    if (parsedTransactions) {
      const updatedAccs = { ...rowAccounts };
      parsedTransactions.forEach((txn) => {
        updatedAccs[txn.tempId] = walletId;
      });
      setRowAccounts(updatedAccs);
    }
  };

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
        categoryMap: rowCategories,
        accountMap: rowAccounts,
      },
      {
        onSuccess: (data) => {
          toast.success(`${data.imported} transaksi berhasil diimport!`);
          setSelectedFile(null);
          setUploadedStatementId(null);
          setSelectedTxnIds(new Set());
          setSelectedBank('');
          setRowCategories({});
          setRowAccounts({});
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.error?.message || 'Gagal mengimport transaksi');
        },
      },
    );
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadedStatementId(null);
    setSelectedTxnIds(new Set());
    setSelectedBank('');
    setRowCategories({});
    setRowAccounts({});
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
          <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
              <div>
                <h3 className="font-semibold">Transaksi Ditemukan</h3>
                <Badge variant="secondary" className="mt-1">{parsedTransactions.length} transaksi</Badge>
              </div>

              {/* Default Wallet Select */}
              <div className="flex items-center gap-2">
                <Label htmlFor="default-wallet" className="text-xs text-muted-foreground whitespace-nowrap">Dompet Default:</Label>
                <select
                  id="default-wallet"
                  value={defaultWallet}
                  onChange={(e) => handleDefaultWalletChange(e.target.value)}
                  className="h-9 w-[150px] rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background"
                >
                  <option value="main">Saldo Utama</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {selectedTxnIds.size} dipilih
              </span>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={selectedTxnIds.size === 0 || importMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
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
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase">Kategori</th>
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase">Dompet</th>
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
                    <td className="p-3 text-sm max-w-[200px] truncate">{txn.description}</td>
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

                    {/* Category Column */}
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={rowCategories[txn.tempId] || ''}
                        onChange={(e) => setRowCategories({ ...rowCategories, [txn.tempId]: e.target.value })}
                        className="h-8 w-[120px] rounded-md border border-input bg-background px-1 py-0.5 text-xs focus:ring-1 focus:ring-emerald-500"
                      >
                        {categories
                          .filter((c) => c.type === txn.type)
                          .map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                      </select>
                    </td>

                    {/* Wallet Column */}
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={rowAccounts[txn.tempId] || 'main'}
                        onChange={(e) => setRowAccounts({ ...rowAccounts, [txn.tempId]: e.target.value })}
                        className="h-8 w-[120px] rounded-md border border-input bg-background px-1 py-0.5 text-xs focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="main">Saldo Utama</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name}
                          </option>
                        ))}
                      </select>
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
  const { data: statements = [], isLoading: isLoadingStatements } = useBankStatements();
  const { data: ocrReceipts = [], isLoading: isLoadingOcr } = useOcrReceipts();

  if (isLoadingStatements || isLoadingOcr) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  // Merge and sort by createdAt descending
  const unifiedHistory = [
    ...statements.map((stmt) => ({ ...stmt, isOcr: false })),
    ...ocrReceipts.map((rec) => ({ ...rec, isOcr: true })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (unifiedHistory.length === 0) {
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
      {unifiedHistory.map((item) => {
        const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
        const isOcr = item.isOcr;

        const label = isOcr
          ? 'Scan Struk (OCR)'
          : (BANK_LABELS[(item as any).bankName as BankName] || (item as any).bankName);

        return (
          <div
            key={item.id}
            className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[20px] text-muted-foreground">
                  {isOcr ? 'receipt_long' : 'description'}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.fileName}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    {label}
                  </Badge>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 w-full sm:w-auto border-t border-border/50 sm:border-0 pt-2 sm:pt-0">
              {!isOcr && (item as any)._count && (item as any)._count.transactions > 0 && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {(item as any)._count.transactions} transaksi
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
        <TabsList className="bg-muted/50 rounded-full p-1 border border-border/50 flex w-full overflow-x-auto hide-scrollbar justify-start">
          <TabsTrigger value="scan" className="gap-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap flex-1 sm:flex-initial">
            <span className="material-symbols-outlined text-[18px]">camera</span>
            Scan Struk
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap flex-1 sm:flex-initial">
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            Import PDF
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap flex-1 sm:flex-initial">
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
