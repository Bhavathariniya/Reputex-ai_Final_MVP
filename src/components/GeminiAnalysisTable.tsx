
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GeminiAnalysisResult {
  overallRisk: number;
  rugPullRisk: number;
  rugPullRiskLabel: string;
  liquidityRisk: number;
  liquidityRiskLabel: string;
  contractRisk: number;
  contractRiskLabel: string;
  communityRisk: number;
  communityRiskLabel: string;
  contractSecurity: number;
  contractSecurityLabel: string;
  liquiditySafety: number;
  liquiditySafetyLabel: string;
  communityHealth: number;
  communityHealthLabel: string;
  marketStability: number;
  marketStabilityLabel: string;
  confidence: number;
  reasoning?: string;
  recommendations?: string[];
  riskFactors?: string[];
}

interface GeminiAnalysisTableProps {
  analysis: GeminiAnalysisResult;
}

const GeminiAnalysisTable: React.FC<GeminiAnalysisTableProps> = ({ analysis }) => {
  // Use the actual numerical values from Gemini API, not extracted percentages
  const metrics = [
    {
      name: 'Overall Risk',
      value: analysis.overallRisk,
      label: 'N/A'
    },
    {
      name: 'Rug Pull Risk',
      value: analysis.rugPullRisk,
      label: analysis.rugPullRiskLabel
    },
    {
      name: 'Liquidity Risk',
      value: analysis.liquidityRisk,
      label: analysis.liquidityRiskLabel
    },
    {
      name: 'Contract Risk',
      value: analysis.contractRisk,
      label: analysis.contractRiskLabel
    },
    {
      name: 'Community Risk',
      value: analysis.communityRisk,
      label: analysis.communityRiskLabel
    },
    {
      name: 'Contract Security',
      value: analysis.contractSecurity,
      label: analysis.contractSecurityLabel
    },
    {
      name: 'Liquidity Safety',
      value: analysis.liquiditySafety,
      label: analysis.liquiditySafetyLabel
    },
    {
      name: 'Community Health',
      value: analysis.communityHealth,
      label: analysis.communityHealthLabel
    },
    {
      name: 'Market Stability',
      value: analysis.marketStability,
      label: analysis.marketStabilityLabel
    },
    {
      name: 'AI Confidence',
      value: analysis.confidence,
      label: 'N/A'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          🤖 Gemini AI Analysis Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-semibold">Metric</th>
                <th className="text-left py-2 px-3 font-semibold">Gemini % Value</th>
                <th className="text-left py-2 px-3 font-semibold">Gemini Label</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, index) => (
                <tr key={index} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="py-2 px-3 font-medium">
                    {metric.name}
                  </td>
                  <td className="py-2 px-3 font-bold text-blue-600">
                    {metric.value}%
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">
                    {metric.label}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {analysis.reasoning && (
          <div className="mt-4 p-3 bg-muted/30 rounded">
            <h4 className="font-semibold mb-2">Gemini AI Reasoning:</h4>
            <p className="text-sm text-muted-foreground">{analysis.reasoning}</p>
          </div>
        )}

        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
            <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">
              📋 Gemini AI Recommendations:
            </h4>
            <ul className="text-sm space-y-1">
              {analysis.recommendations.map((rec, index) => (
                <li key={index} className="text-blue-700 dark:text-blue-300">
                  • {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.riskFactors && analysis.riskFactors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded">
            <h4 className="font-semibold mb-2 text-red-800 dark:text-red-200">
              ⚠️ Gemini AI Risk Factors:
            </h4>
            <ul className="text-sm space-y-1">
              {analysis.riskFactors.map((factor, index) => (
                <li key={index} className="text-red-700 dark:text-red-300">
                  • {factor}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeminiAnalysisTable;
