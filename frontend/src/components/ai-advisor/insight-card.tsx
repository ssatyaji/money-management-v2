'use client';
import Link from 'next/link';
import { Sparkles, ChevronRight } from 'lucide-react';
import { AiInsight } from '@/lib/api/ai-advisor.api';

export function InsightCard({
  insight,
  onAskMore,
}: {
  insight: AiInsight;
  onAskMore: (i: AiInsight) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-4 space-y-2 hover:border-indigo-500/30 transition-all">
      <div className="flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
        <p className="text-sm font-semibold">{insight.title}</p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed pl-6">{insight.body}</p>
      <div className="flex items-center gap-2 pl-6">
        <button
          onClick={() => onAskMore(insight)}
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
        >
          Tanya lebih lanjut <ChevronRight className="w-3 h-3" />
        </button>
        {insight.actionLabel && insight.actionUrl && (
          <>
            <span className="text-muted-foreground">·</span>
            <Link
              href={insight.actionUrl}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              {insight.actionLabel} <ChevronRight className="w-3 h-3" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
