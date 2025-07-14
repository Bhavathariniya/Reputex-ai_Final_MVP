
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Play, Sparkles, HelpCircle, Info, FileText, Video, Check, Search } from 'lucide-react';

const TutorialFAQ: React.FC = () => {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="space-y-6 mb-8">
      {/* Tutorial Video Section */}
      <Card className="glass-card border-neon-orange">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-neon-orange" />
            Animated Walkthrough
          </CardTitle>
          <CardDescription>
            Learn how to use ReputeX AI to analyze tokens and wallets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showVideo ? (
            <div className="aspect-video bg-muted/30 rounded-lg overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-muted-foreground">
                  Tutorial video content would appear here.
                  <br/>
                  In a production environment, this would be an embedded video
                  explaining how to use the ReputeX AI platform.
                </p>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center">
              <div className="text-center p-6">
                <h3 className="text-xl font-semibold mb-2">ReputeX AI Tutorial</h3>
                <p className="text-muted-foreground mb-4">
                  Watch this quick tutorial to learn how to analyze tokens and wallets 
                  using ReputeX AI's powerful analysis tools.
                </p>
                <Button 
                  className="bg-neon-orange hover:bg-neon-orange/80"
                  onClick={() => setShowVideo(true)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Watch Tutorial
                </Button>
              </div>
            </div>
          )}
          
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 border border-muted rounded-md bg-muted/30">
              <div className="flex items-center gap-2 mb-1 text-neon-orange">
                <Search className="h-4 w-4" />
                <h4 className="font-medium">Step 1</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Select a blockchain network and enter a token or wallet address to analyze
              </p>
            </div>
            
            <div className="p-3 border border-muted rounded-md bg-muted/30">
              <div className="flex items-center gap-2 mb-1 text-neon-orange">
                <Sparkles className="h-4 w-4" />
                <h4 className="font-medium">Step 2</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Click "Analyze" to process the address with our AI-powered engine
              </p>
            </div>
            
            <div className="p-3 border border-muted rounded-md bg-muted/30">
              <div className="flex items-center gap-2 mb-1 text-neon-orange">
                <Check className="h-4 w-4" />
                <h4 className="font-medium">Step 3</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Review the comprehensive analysis across multiple risk categories
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="glass-card border-neon-cyan">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-neon-cyan" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription>
            Common questions about our analysis methodology and features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>
                How accurate is ReputeX AI's analysis?
              </AccordionTrigger>
              <AccordionContent>
                ReputeX AI provides highly accurate analysis based on on-chain data and 
                contract code examination. Our analysis uses multiple indicators to 
                identify potential risks, but it's important to remember that no 
                analysis system is 100% perfect. Always conduct your own research 
                in addition to using our platform.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>
                What blockchains are supported?
              </AccordionTrigger>
              <AccordionContent>
                Currently, ReputeX AI primarily focuses on Ethereum tokens and wallets, using the 
                Etherscan API for data gathering. We plan to expand to more networks 
                including Binance Smart Chain, Polygon, Arbitrum, Optimism, Solana, and others 
                in future updates.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>
                How does the token risk score calculation work?
              </AccordionTrigger>
              <AccordionContent>
                Our risk scores are calculated using a combination of factors including:
                <ul className="list-disc pl-4 mt-2 space-y-1">
                  <li>Smart contract code analysis for risky functions</li>
                  <li>Liquidity status and holder concentration</li>
                  <li>Transaction patterns and token transfer behavior</li>
                  <li>Similarity to known scam patterns</li>
                  <li>Historical data about the deployer wallet</li>
                </ul>
                These factors are weighted based on their relative importance to generate the final risk scores.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger>
                What is a "honeypot" token?
              </AccordionTrigger>
              <AccordionContent>
                A honeypot token is a deceptive cryptocurrency designed to allow users to 
                purchase the token but prevent them from selling it later. These tokens typically 
                have special code in their smart contracts that permits buying but blocks selling 
                operations, trapping investor funds. ReputeX AI analyzes contract code to detect 
                these malicious functions.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger>
                What is a Sybil attack in crypto?
              </AccordionTrigger>
              <AccordionContent>
                A Sybil attack in cryptocurrency refers to a situation where a single entity 
                controls multiple wallets to create the illusion of widespread adoption or 
                trading activity. These attacks are often used to manipulate token prices, 
                fake community interest, or influence governance votes. Our platform detects 
                suspicious patterns in token transfers that may indicate Sybil activity.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6">
              <AccordionTrigger>
                How often is the data updated?
              </AccordionTrigger>
              <AccordionContent>
                ReputeX AI performs real-time analysis whenever you submit an address. 
                The analysis is based on the latest on-chain data available from blockchain 
                explorers. Historical analyses are saved for comparison, but we always 
                encourage running a fresh analysis for the most current information.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-7">
              <AccordionTrigger>
                Can ReputeX AI predict if a token will increase in value?
              </AccordionTrigger>
              <AccordionContent>
                No, ReputeX AI is designed to detect scams and assess security risks, not 
                to predict price movements or investment returns. Our focus is on security 
                analysis and technical assessments of contract code. Even tokens with good 
                security scores may not perform well as investments, and you should always do 
                your own research on the project's fundamentals, team, and market potential.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorialFAQ;
