'use client';

import Link from 'next/link';
import { X, AlertTriangle, Info, CheckCircle, TrendingDown, ArrowRight } from 'lucide-react';
import { AlertItem } from '@/lib/api/alerts.api';
import { useAlerts, useMarkAlertRead, useMarkAllAlertsRead } from '@/hooks/use-alerts';

const sev = {
  INFO: {
    Icon: Info,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  WARNING: {
    Icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  DANGER: {
    Icon: TrendingDown,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  SUCCESS: {
    Icon: CheckCircle,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
};

function AlertCard({ alert }: { alert: AlertItem }) {
  const markRead = useMarkAlertRead();
  const c = sev[alert.severity] || sev.INFO;
  const { Icon } = c;
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 ${c.bg} ${c.border}`}>
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${c.color}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{alert.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</p>
        {alert.actionUrl && alert.actionLabel && (
          <Link
            href={alert.actionUrl}
            className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/40 rounded-lg transition-colors"
          >
            <span>{alert.actionLabel}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      <button
        onClick={() => markRead.mutate(alert.id)}
        className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-lg"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function AlertCards() {
  const { data: alerts } = useAlerts();
  const markAll = useMarkAllAlertsRead();

  const activeAlerts = alerts?.filter((a) => !a.isRead) || [];
  if (!activeAlerts.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Notifikasi</p>
        {activeAlerts.length > 1 && (
          <button
            onClick={() => markAll.mutate()}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Tandai semua dibaca
          </button>
        )}
      </div>
      {activeAlerts.slice(0, 3).map((a) => (
        <AlertCard key={a.id} alert={a} />
      ))}
    </div>
  );
}
