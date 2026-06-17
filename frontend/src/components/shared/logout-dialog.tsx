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
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="mx-auto sm:mx-0 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
            <LogOut className="w-6 h-6 text-destructive" />
          </div>
          <DialogTitle>Konfirmasi Keluar</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin keluar dari akun Anda? Anda perlu login kembali untuk mengakses aplikasi.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="rounded-full"
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-full gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
                Keluar...
              </>
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
