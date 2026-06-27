import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LoadingAnimation from '@/components/LoadingAnimation';
import ResultTabs from '@/components/ResultTabs';
import { toast } from 'sonner';
import { TokenData } from '@/lib/api-client';
import { MLAnalysisResult } from '@/lib/ml/tokenMLService';
import MLAnalysisCard from '@/components/MLAnalysisCard';
import { analyzeAddress, toResultViewModel } from '@/lib/reputexApi';

/**
 * Result page.
 *
 * All analysis now runs server-side via the ReputeX backend (genuine,
 * deterministic scoring engine). This page makes ONE call and renders the
 * mapped view model — no provider keys or scoring logic live in the browser.
 */
const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const addressFromParams = searchParams.get('address');
  const networkFromParams = searchParams.get('network');

  const { address = addressFromParams, network = networkFromParams || 'auto' } = location.state || {};

  const [isLoading, setIsLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [contractAnalysis, setContractAnalysis] = useState<any>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [mlAnalysis, setMLAnalysis] = useState<MLAnalysisResult | null>(null);
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

        const vm = toResultViewModel(result);
        setMLAnalysis(vm.mlAnalysis);
        setTokenData(vm.tokenData);
        setAnalysisData(vm.analysisData);
        setContractAnalysis(vm.contractAnalysis);
        setResolvedNetwork(vm.resolvedNetwork);
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h1 className="text-xl sm:text-2xl font-bold">AI Risk Analysis Results</h1>
            <div className="text-sm text-muted-foreground">
              Network: <span className="font-semibold capitalize">{resolvedNetwork}</span>
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs sm:text-sm font-mono bg-muted/30 p-2 rounded break-all">{address}</p>
            </CardContent>
          </Card>

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
              {mlAnalysis && <MLAnalysisCard mlAnalysis={mlAnalysis} isLoading={false} />}

              {(contractAnalysis || analysisData) && (
                <ResultTabs
                  contractAnalysis={contractAnalysis}
                  analysisData={analysisData}
                  tokenData={tokenData}
                  address={address}
                  network={resolvedNetwork || 'ethereum'}
                  mlAnalysis={mlAnalysis}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Result;
