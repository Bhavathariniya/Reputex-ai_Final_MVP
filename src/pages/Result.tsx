import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingAnimation from '@/components/LoadingAnimation';
import TokenReport from '@/components/TokenReport';
import TokenAnalytics from '@/components/TokenAnalytics';
import { SpiralAnimation } from '@/components/ui/spiral-animation';
import { toast } from 'sonner';
import { analyzeAddress, type AnalyzeResult } from '@/lib/reputexApi';
import { TELEGRAM_BOT_URL } from '@/config/links';

/**
 * Result page.
 *
 * All analysis runs server-side via the ReputeX backend (genuine, deterministic
 * scoring engine). This page makes ONE call, then leads with a structured
 * report (verdict, weighted pillars, findings) followed by chart-driven
 * analytics. A themed spiral animation sits behind everything.
 */
const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const addressFromParams = searchParams.get('address');
  const networkFromParams = searchParams.get('network');

  const { address = addressFromParams, network = networkFromParams || 'auto' } = location.state || {};

  const [isLoading, setIsLoading] = useState(true);
  const [rawResult, setRawResult] = useState<AnalyzeResult | null>(null);
  const [resolvedNetwork, setResolvedNetwork] = useState<string>(network || 'ethereum');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      navigate('/', { replace: true });
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await analyzeAddress(address, network || 'auto');
        if (cancelled) return;

        setRawResult(result);
        setResolvedNetwork(result.network);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(message);
        toast.error('Failed to analyze token', { description: message });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [address, network, navigate]);

  if (!address) return null;

  return (
    <div className="relative min-h-screen">
      {/* Themed spiral background */}
      <div className="fixed inset-0 z-0 opacity-50 pointer-events-none">
        <SpiralAnimation />
      </div>
      <div className="fixed inset-0 z-0 bg-background/55 pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
          <a href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-2 border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10">
              <Send className="h-4 w-4" />
              Scan on Telegram
            </Button>
          </a>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h1 className="text-xl sm:text-2xl font-bold">Token Safety Report</h1>
            <div className="text-sm text-muted-foreground">
              Network: <span className="font-semibold capitalize">{resolvedNetwork}</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingAnimation />
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md">
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {rawResult && <TokenReport result={rawResult} />}

              {rawResult && (
                <div className="pt-2">
                  <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Detailed analytics</h2>
                  <TokenAnalytics result={rawResult} address={address} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Result;
