
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Code, Copy, ChevronDown, ChevronUp, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { fetchContractCode, formatSourceCode, getContractSummary, ContractSourceInfo } from '@/utils/etherscanService';

interface ContractCodeDisplayProps {
  contractAddress: string;
  tokenName?: string;
}

const ContractCodeDisplay: React.FC<ContractCodeDisplayProps> = ({ 
  contractAddress, 
  tokenName = 'Token' 
}) => {
  const [contractInfo, setContractInfo] = useState<ContractSourceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullCode, setShowFullCode] = useState(false);

  useEffect(() => {
    const loadContractCode = async () => {
      if (!contractAddress) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const info = await fetchContractCode(contractAddress);
        setContractInfo(info);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch contract code';
        setError(errorMessage);
        console.error('Contract code fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadContractCode();
  }, [contractAddress]);

  const handleCopyCode = async () => {
    if (!contractInfo?.sourceCode) return;
    
    try {
      await navigator.clipboard.writeText(contractInfo.sourceCode);
      toast.success('Contract code copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy code to clipboard');
    }
  };

  const displayCode = contractInfo?.sourceCode 
    ? (showFullCode 
        ? formatSourceCode(contractInfo.sourceCode)
        : getContractSummary(formatSourceCode(contractInfo.sourceCode), 50)
      )
    : '';

  const codeLineCount = contractInfo?.sourceCode?.split('\n').length || 0;

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Smart Contract Code
          </CardTitle>
          <CardDescription>
            Loading verified contract source code...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              Smart Contract Code
            </CardTitle>
            <CardDescription>
              {tokenName} contract source code verification
            </CardDescription>
          </div>
          
          {contractInfo?.isVerified && (
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-400">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {error ? (
          <div className="flex items-center gap-2 p-4 border border-red-500/20 rounded-md bg-red-500/5">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Error Loading Contract Code</p>
              <p className="text-xs text-red-300 mt-1">{error}</p>
            </div>
          </div>
        ) : !contractInfo?.isVerified ? (
          <div className="flex items-center gap-2 p-4 border border-amber-500/20 rounded-md bg-amber-500/5">
            <AlertCircle className="h-5 w-5 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-400">Contract Not Verified</p>
              <p className="text-xs text-amber-300 mt-1">
                Smart contract source code is not verified or publicly available on Etherscan.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Contract Info */}
            <div className="flex flex-wrap gap-2 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Contract:</span>
                <span className="font-medium">{contractInfo.contractName}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Compiler:</span>
                <span className="font-medium">{contractInfo.compilerVersion}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Lines:</span>
                <span className="font-medium">{codeLineCount.toLocaleString()}</span>
              </div>
            </div>

            {/* Collapsible Code Section */}
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <div className="flex items-center justify-between">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    {isExpanded ? 'Hide' : 'Show'} Source Code
                  </Button>
                </CollapsibleTrigger>
                
                {isExpanded && contractInfo.sourceCode && (
                  <div className="flex items-center gap-2">
                    {codeLineCount > 50 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFullCode(!showFullCode)}
                        className="text-xs"
                      >
                        {showFullCode ? 'Show Summary' : 'Show Full Code'}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyCode}
                      className="flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </Button>
                  </div>
                )}
              </div>
              
              <CollapsibleContent className="mt-4">
                <div className="relative">
                  <pre className="bg-slate-950 border border-slate-800 rounded-md p-4 text-sm overflow-x-auto max-h-96 overflow-y-auto">
                    <code className="text-slate-200 whitespace-pre-wrap font-mono">
                      {displayCode}
                    </code>
                  </pre>
                  
                  {!showFullCode && codeLineCount > 50 && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none rounded-b-md" />
                  )}
                </div>
                
                {!showFullCode && codeLineCount > 50 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Showing first 50 lines of {codeLineCount.toLocaleString()} total lines
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContractCodeDisplay;
