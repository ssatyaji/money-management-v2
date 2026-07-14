'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreatePlatformExpense } from '@/hooks/use-admin';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const expenseSchema = z.object({
  description: z.string().min(3, 'Deskripsi minimal 3 karakter'),
  amount: z.number().positive('Nominal harus lebih besar dari 0'),
  category: z.string().min(1, 'Pilih kategori'),
  notes: z.string().optional(),
  date: z.string().min(1, 'Pilih tanggal'),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface PlatformExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlatformExpenseDialog({ isOpen, onClose }: PlatformExpenseDialogProps) {
  const { mutate: createExpense, isPending } = useCreatePlatformExpense();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: 0,
      category: 'HOSTING',
      notes: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        description: '',
        amount: 0,
        category: 'HOSTING',
        notes: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [isOpen, form]);

  const onSubmit = (data: ExpenseFormValues) => {
    createExpense(
      {
        ...data,
        date: new Date(data.date).toISOString(),
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Pengeluaran Platform</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi / Nama Biaya</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Contoh: Tagihan Vercel Pro" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nominal (Rp)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="Masukkan jumlah nominal"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="HOSTING">Hosting / Server</SelectItem>
                      <SelectItem value="API_COST">Layanan API (OCR, AI)</SelectItem>
                      <SelectItem value="MARKETING">Pemasaran / Iklan</SelectItem>
                      <SelectItem value="SALARY">Gaji / Freelancer</SelectItem>
                      <SelectItem value="OTHERS">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan Tambahan (Opsional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Keterangan opsional" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Menyimpan...' : 'Simpan Biaya'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
