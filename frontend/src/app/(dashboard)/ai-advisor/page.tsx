'use client';
import { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useAiInsights, useGenerateInsights } from '@/hooks/use-ai-advisor';
import { InsightCard } from '@/components/ai-advisor/insight-card';
import { ChatInterface } from '@/components/ai-advisor/chat-interface';
import { AiInsight } from '@/lib/api/ai-advisor.api';
import { Skeleton } from '@/components/ui/skeleton';

export default function AiAdvisorPage() {
  const { data: insights, isLoading } = useAiInsights();
  const gen = useGenerateInsights();
  const [chatMsg, setChatMsg] = useState('');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            AI Financial Advisor
          </h1>
          <p className="text-muted-foreground mt-1">Insight personal dan konsultasi keuangan berbasis AI</p>
        </div>
        <button
          onClick={() => gen.mutate()}
          disabled={gen.isPending}
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border/40 rounded-xl px-3 py-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${gen.isPending ? 'animate-spin' : ''}`} />
          Generate Insight Baru
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Insight Minggu Ini</h2>
          {isLoading ? (
            <>
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </>
          ) : insights?.length ? (
            insights.map((i) => (
              <InsightCard
                key={i.id}
                insight={i}
                onAskMore={(ins: AiInsight) => setChatMsg(`Ceritakan lebih lanjut: ${ins.title}`)}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-border/40 p-8 text-center bg-card/30">
              <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Klik "Generate Insight Baru" untuk memulai.</p>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tanya AI</h2>
          <ChatInterface initialMessage={chatMsg} context="GENERAL" />
        </div>
      </div>
    </div>
  );
}
