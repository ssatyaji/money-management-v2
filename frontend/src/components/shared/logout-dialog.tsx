'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface LogoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function LogoutDialog({ open, onOpenChange, onConfirm, isLoading }: LogoutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6" showCloseButton={false}>
        <DialogHeader className="text-center sm:text-left">
          <div className="mx-auto sm:mx-0 w-11 h-11 rounded-xl bg-destructive/10 dark:bg-destructive/15 flex items-center justify-center mb-3">
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">Konfirmasi Keluar</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Apakah Anda yakin ingin keluar dari akun Anda? Anda perlu login kembali untuk mengakses aplikasi.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 gap-2 flex flex-col-reverse sm:flex-row justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="rounded-xl font-semibold"
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-xl font-semibold gap-2"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                Ya, Keluar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
