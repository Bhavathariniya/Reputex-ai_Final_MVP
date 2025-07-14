
import React from 'react';
import { 
  Shield, 
  Code, 
  BarChart3,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  ShieldX,
  Users,
  Droplet,
  BarChart2,
  MessageCircle,
  Lock,
  LockOpen,
  Bug,
  CirclePercent,
  Brain
} from 'lucide-react';

export enum ScoreLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

interface ScoreCardProps {
  title: string;
  score: number;
  type: 'trust' | 'developer' | 'liquidity' | 'community' | 'holders' | 'fraud' | 'sentiment' | 'confidence' | 'contract' | 'market' | 'ownership' | 'honeypot';
  description?: string;
  isAIEnhanced?: boolean;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ title, score, type, description, isAIEnhanced = false }) => {
  // Determine score level based on type (some types are inverted)
  const isInvertedType = ['fraud', 'ownership', 'honeypot'].includes(type);
  const effectiveScore = isInvertedType ? 100 - score : score;
  
  const scoreLevel: ScoreLevel = 
    effectiveScore >= 80 ? ScoreLevel.HIGH :
    effectiveScore >= 50 ? ScoreLevel.MEDIUM :
    ScoreLevel.LOW;
  
  // Generate description if not provided
  const autoDescription = () => {
    if (description) return description;
    
    switch(type) {
      case 'trust':
        return scoreLevel === ScoreLevel.HIGH 
          ? "This token shows strong indicators of legitimacy and trustworthiness."
          : scoreLevel === ScoreLevel.MEDIUM
          ? "This token has some concerns but appears generally reliable."
          : "This token has multiple red flags and requires extreme caution.";
      
      case 'developer':
        return scoreLevel === ScoreLevel.HIGH
          ? "Developer activity and commitment is high with verified contract."
          : scoreLevel === ScoreLevel.MEDIUM
          ? "Moderate developer presence with some positive signals."
          : "Limited developer activity or contract verification issues.";
          
      case 'liquidity':
        return scoreLevel === ScoreLevel.HIGH
          ? "Strong liquidity with minimal rug pull risk and secure trading."
          : scoreLevel === ScoreLevel.MEDIUM
          ? "Adequate liquidity for normal trading operations."
          : "Low liquidity safety - potential trading restrictions detected.";
          
      case 'community':
        return scoreLevel === ScoreLevel.HIGH
          ? "Strong and active community support with high engagement."
          : scoreLevel === ScoreLevel.MEDIUM
          ? "Growing community with moderate activity and presence."
          : "Limited community presence or engagement detected.";
          
      case 'holders':
        return scoreLevel === ScoreLevel.HIGH
          ? "Well-distributed token ownership across many holders."
          : scoreLevel === ScoreLevel.MEDIUM
          ? "Some concentration among major holders but acceptable."
          : "Highly concentrated token distribution - risk of manipulation.";
          
      case 'fraud':
        return scoreLevel === ScoreLevel.LOW
          ? "No significant fraud indicators detected in analysis."
          : scoreLevel === ScoreLevel.MEDIUM
          ? "Some suspicious patterns detected - exercise caution."
          : "Multiple fraud indicators detected - high risk investment.";
          
      case 'sentiment':
        return scoreLevel === ScoreLevel.HIGH
          ? "Highly positive sentiment across social media platforms."
          : scoreLevel === ScoreLevel.MEDIUM
          ? "Mixed sentiment with both positive and negative signals."
          : "Predominantly negative social sentiment detected.";

      case 'contract':
        return scoreLevel === ScoreLevel.HIGH
          ? "Contract is verified with strong security measures."
          : scoreLevel === ScoreLevel.MEDIUM
          ? "Contract has some security features but may have concerns."
          : "Contract security is questionable - unverified or risky functions.";

      case 'market':
        return scoreLevel === ScoreLevel.HIGH
          ? "Market shows stable patterns with healthy trading activity."
          : scoreLevel === ScoreLevel.MEDIUM
          ? "Market has moderate stability with some volatility."
          : "Market is highly volatile or shows concerning patterns.";

      case 'ownership':
        return scoreLevel === ScoreLevel.HIGH
          ? "Token ownership is well distributed among many holders."
          : scoreLevel === ScoreLevel.MEDIUM
          ? "Ownership has some concentration but within acceptable limits."
          : "Ownership is highly concentrated - significant rug pull risk.";

      case 'honeypot':
        return scoreLevel === ScoreLevel.HIGH
          ? "No honeypot indicators - token can be traded freely."
          : scoreLevel === ScoreLevel.MEDIUM
          ? "Some trading restrictions may apply - verify before investing."
          : "High honeypot risk - may not be able to sell after purchase.";
          
      default:
        return "AI-powered analysis of multiple risk factors and indicators.";
    }
  };
  
  // Generate description
  const finalDescription = description || autoDescription();
  
  // Pick icon based on type
  const renderIcon = () => {
    switch (type) {
      case 'trust':
        return scoreLevel === ScoreLevel.HIGH ? (
          <ShieldCheck className="h-6 w-6 text-neon-cyan" />
        ) : scoreLevel === ScoreLevel.MEDIUM ? (
          <Shield className="h-6 w-6 text-neon-purple" />
        ) : (
          <ShieldX className="h-6 w-6 text-neon-pink" />
        );
      
      case 'developer':
      case 'contract':
        return <Code className="h-6 w-6 text-neon-blue" />;
      
      case 'liquidity':
        return scoreLevel === ScoreLevel.HIGH ? (
          <TrendingUp className="h-6 w-6 text-neon-cyan" />
        ) : (
          <Droplet className="h-6 w-6 text-neon-purple" />
        );
      
      case 'community':
        return <Users className="h-6 w-6 text-neon-blue" />;
        
      case 'holders':
        return <CirclePercent className="h-6 w-6 text-neon-cyan" />;
        
      case 'fraud':
        return scoreLevel === ScoreLevel.LOW ? (
          <ShieldCheck className="h-6 w-6 text-neon-cyan" />
        ) : scoreLevel === ScoreLevel.MEDIUM ? (
          <AlertTriangle className="h-6 w-6 text-neon-purple" />
        ) : (
          <Bug className="h-6 w-6 text-neon-pink" />
        );
        
      case 'sentiment':
        return <MessageCircle className="h-6 w-6 text-neon-purple" />;
        
      case 'confidence':
        return scoreLevel === ScoreLevel.HIGH ? (
          <Lock className="h-6 w-6 text-neon-cyan" />
        ) : (
          <LockOpen className="h-6 w-6 text-neon-purple" />
        );

      case 'market':
        return <BarChart3 className="h-6 w-6 text-neon-blue" />;

      case 'ownership':
        return scoreLevel === ScoreLevel.HIGH ? (
          <Users className="h-6 w-6 text-neon-cyan" />
        ) : (
          <AlertTriangle className="h-6 w-6 text-neon-pink" />
        );

      case 'honeypot':
        return scoreLevel === ScoreLevel.HIGH ? (
          <ShieldCheck className="h-6 w-6 text-neon-cyan" />
        ) : (
          <Bug className="h-6 w-6 text-neon-pink" />
        );
        
      default:
        return <AlertTriangle className="h-6 w-6 text-neon-purple" />;
    }
  };

  // Display score (invert for certain risk types)
  const displayScore = isInvertedType ? 100 - score : score;
  
  return (
    <div className="glowing-card rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02]">
      <div className={`h-1 bg-gradient-to-r ${
        scoreLevel === ScoreLevel.HIGH
          ? 'from-neon-cyan to-neon-blue'
          : scoreLevel === ScoreLevel.MEDIUM
          ? 'from-neon-purple to-neon-blue'
          : 'from-neon-pink to-neon-violet'
      }`}></div>
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {renderIcon()}
            <h3 className="text-lg font-semibold">{title}</h3>
            {isAIEnhanced && (
              <div className="flex items-center gap-1">
                <Brain className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-purple-400">AI</span>
              </div>
            )}
          </div>
          <div className="text-2xl font-bold">{displayScore}<span className="text-sm text-muted-foreground">/100</span></div>
        </div>
        
        <div className="score-bar mb-3">
          <div 
            className={`score-bar-fill ${scoreLevel}`}
            style={{ '--score-percentage': `${displayScore}%` } as React.CSSProperties}
          ></div>
        </div>
        
        {finalDescription && (
          <p className="text-sm text-muted-foreground mt-3">{finalDescription}</p>
        )}
      </div>
    </div>
  );
};

export default ScoreCard;
