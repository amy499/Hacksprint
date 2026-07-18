import React, { createContext, useContext, useState, useCallback } from 'react';

export interface VariantScore {
  loadsOk: boolean;
  loadTimeMs: number | null;
  hasKeyElements: boolean;
  mobileFriendly: boolean;
  personaScore: number | null;
  personaVerdict: string | null;
  overallScore: number;
}

export interface Variant {
  backendLabel: string;
  frontendLabel: string;
  previewUrl?: string;
  sandboxId?: string;
  code?: string;
  error?: string;
  score?: VariantScore;
}

export interface Trend {
  title: string;
  url: string;
  description: string;
}

export interface Suggestion {
  title: string;
  reason: string;
}

interface PipelineState {
  prompt: string;
  variants: Variant[];
  winner: Variant | null;
  trends: Trend[];
  suggestions: Suggestion[];
  generating: boolean;
  scoring: boolean;
  suggesting: boolean;
  generateError: string | null;
  scoreError: string | null;
  suggestError: string | null;
  generateVariants: (prompt: string) => Promise<void>;
  scoreVariants: () => Promise<void>;
  fetchSuggestions: () => Promise<void>;
}

const PipelineContext = createContext<PipelineState | undefined>(undefined);

export function PipelineProvider({ children }: { children: React.ReactNode }) {
  const [prompt, setPrompt] = useState('');
  const [variants, setVariants] = useState<Variant[]>([]);
  const [winner, setWinner] = useState<Variant | null>(null);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const generateVariants = useCallback(async (newPrompt: string) => {
    // Clean up sandboxes from the previous run before starting a new one - otherwise
    // they sit alive until the 30-minute TTL safety net, which eats into Daytona's
    // disk quota fast if you try a few prompts back-to-back while testing.
    const previousSandboxIds = variants.map((v) => v.sandboxId).filter((id): id is string => Boolean(id));
    if (previousSandboxIds.length > 0) {
      Promise.allSettled(previousSandboxIds.map((id) => fetch(`/api/sandbox/${id}`, { method: 'DELETE' })));
    }

    setPrompt(newPrompt);
    setGenerating(true);
    setGenerateError(null);
    setVariants([]);
    setWinner(null);
    try {
      const res = await fetch('/api/generate-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: newPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate variants');
      setVariants(data.variants);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  }, [variants]);

  const scoreVariants = useCallback(async () => {
    setScoring(true);
    setScoreError(null);
    try {
      const res = await fetch('/api/score-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variants }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to score variants');
      setVariants(data.variants);
      setWinner(data.winner);
    } catch (err) {
      setScoreError(err instanceof Error ? err.message : String(err));
    } finally {
      setScoring(false);
    }
  }, [variants]);

  const fetchSuggestions = useCallback(async () => {
    setSuggesting(true);
    setSuggestError(null);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch suggestions');
      setTrends(data.trends);
      setSuggestions(data.suggestions);
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : String(err));
    } finally {
      setSuggesting(false);
    }
  }, [prompt]);

  return (
    <PipelineContext.Provider
      value={{
        prompt,
        variants,
        winner,
        trends,
        suggestions,
        generating,
        scoring,
        suggesting,
        generateError,
        scoreError,
        suggestError,
        generateVariants,
        scoreVariants,
        fetchSuggestions,
      }}
    >
      {children}
    </PipelineContext.Provider>
  );
}

export function usePipeline() {
  const context = useContext(PipelineContext);
  if (context === undefined) {
    throw new Error('usePipeline must be used within a PipelineProvider');
  }
  return context;
}
