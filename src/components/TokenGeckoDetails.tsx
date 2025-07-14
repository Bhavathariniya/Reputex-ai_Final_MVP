
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { Loader2, ExternalLink, Twitter, MessageCircle, Globe, Link, Facebook, Linkedin, AlertCircle } from "lucide-react";
import { getTokenDetailsFromGeckoTerminal, formatNumber, formatCurrency } from "../lib/api/geckoterminal";
import { cn } from "../lib/utils";
import { toast } from "sonner";

interface TokenGeckoDetailsProps {
  contractAddress: string;
}

const TokenGeckoDetails: React.FC<TokenGeckoDetailsProps> = ({ contractAddress }) => {
  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState<any>(null);
  const [geckoData, setGeckoData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!contractAddress) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch data from GeckoTerminal
        const data = await getTokenDetailsFromGeckoTerminal(contractAddress);
        console.log("GeckoTerminal API response:", data);
        
        if (!data) {
          setError("No data available for this token");
          toast.error("Could not fetch token market data", {
            description: "This token may not be listed on GeckoTerminal"
          });
        } else {
          setTokenData(data);
          
          // Log social media data for debugging
          if (data.tokenData?.socials) {
            console.log("Social media data found in GeckoTerminal:", data.tokenData.socials);
          } else {
            console.log("No social media data found in GeckoTerminal");
          }
          
          // Try to get additional data from CoinGecko API
          try {
            // Use the CoinGecko ID from GeckoTerminal if available
            // Use optional chaining to safely access the property
            const geckoId = data.tokenData?.coingecko_coin_id;
            if (geckoId) {
              const response = await fetch(
                `https://api.coingecko.com/api/v3/coins/${geckoId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false&x_cg_api_key=CG-LggZcVpfVpN9wDLpAsMoy7Yr`
              );
              
              if (response.ok) {
                const geckoDataResponse = await response.json();
                console.log("CoinGecko API response:", geckoDataResponse);
                setGeckoData(geckoDataResponse);
              }
            } else {
              // Try to get by contract address
              const response = await fetch(
                `https://api.coingecko.com/api/v3/coins/ethereum/contract/${contractAddress}?x_cg_api_key=CG-LggZcVpfVpN9wDLpAsMoy7Yr`
              );
              
              if (response.ok) {
                const geckoDataResponse = await response.json();
                console.log("CoinGecko contract API response:", geckoDataResponse);
                setGeckoData(geckoDataResponse);
              }
            }
          } catch (geckoErr) {
            console.warn("Could not fetch CoinGecko data:", geckoErr);
            // Non-critical error, we can continue with just GeckoTerminal data
          }
        }
      } catch (err) {
        console.error("Error fetching GeckoTerminal data:", err);
        setError("Failed to load token data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [contractAddress, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Function to format social media links
  const formatSocialLink = (platform: string, value?: string | null) => {
    if (!value) return null;
    
    switch(platform) {
      case 'twitter':
        return value.startsWith('http') ? value : `https://twitter.com/${value}`;
      case 'telegram':
        return value.startsWith('http') ? value : `https://t.me/${value}`;
      case 'website':
        return value.startsWith('http') ? value : `https://${value}`;
      case 'discord':
        return value;
      case 'facebook':
        return value.startsWith('http') ? value : `https://facebook.com/${value}`;
      case 'linkedin':
        return value.startsWith('http') ? value : value;
      default:
        return value;
    }
  };

  // Get social media links from GeckoTerminal or CoinGecko
  const getSocialMedia = () => {
    const socials: {
      twitter_username?: string | null;
      telegram_handle?: string | null;
      website_url?: string | null;
      discord_url?: string | null;
      facebook_username?: string | null;
      linkedin_url?: string | null;
    } = {};
    
    // Try to get from GeckoTerminal first
    if (tokenData?.tokenData?.socials) {
      Object.assign(socials, tokenData.tokenData.socials);
    }
    
    // Merge with CoinGecko data if available (takes precedence)
    if (geckoData?.links) {
      const geckoLinks = geckoData.links;
      
      // Process Twitter
      if (geckoLinks.twitter_screen_name) {
        socials.twitter_username = geckoLinks.twitter_screen_name;
      }
      
      // Process Telegram
      if (geckoLinks.telegram_channel_identifier) {
        socials.telegram_handle = geckoLinks.telegram_channel_identifier;
      }
      
      // Process Website (use first URL if it's an array)
      if (geckoLinks.homepage && geckoLinks.homepage.length > 0) {
        const homepage = geckoLinks.homepage.find((url: string) => url && url.trim() !== "");
        if (homepage) {
          socials.website_url = homepage;
        }
      }
      
      // Process Discord - not standard in CoinGecko response but try to check
      if (geckoLinks.chat_url && geckoLinks.chat_url.length > 0) {
        const discordUrl = geckoLinks.chat_url.find((url: string) => url && url.includes('discord'));
        if (discordUrl) {
          socials.discord_url = discordUrl;
        }
      }
      
      // Process Facebook
      if (geckoLinks.facebook_username) {
        socials.facebook_username = geckoLinks.facebook_username;
      }
      
      // Process Reddit as a fallback if available
      if (geckoLinks.subreddit_url && !socials.discord_url) {
        socials.discord_url = geckoLinks.subreddit_url; // Not discord but using this field
      }
      
      // LinkedIn - not standard in CoinGecko but could be in GeckoTerminal
    }
    
    return socials;
  };
  
  // Check if token has any social media links
  const hasSocialMedia = (socials?: any) => {
    if (!socials) return false;
    
    return !!(
      socials.twitter_username || 
      socials.telegram_handle || 
      socials.website_url || 
      socials.discord_url ||
      socials.facebook_username ||
      socials.linkedin_url ||
      // Check CoinGecko-specific fields
      (geckoData?.links?.twitter_screen_name) ||
      (geckoData?.links?.telegram_channel_identifier) ||
      (geckoData?.links?.homepage && geckoData.links.homepage.length > 0 && geckoData.links.homepage[0]) ||
      (geckoData?.links?.chat_url && geckoData.links.chat_url.length > 0) ||
      (geckoData?.links?.facebook_username) ||
      (geckoData?.links?.subreddit_url)
    );
  };

  const socials = getSocialMedia();

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Market Data</CardTitle>
          <CardDescription>Loading token market data...</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error || !tokenData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Market Data</CardTitle>
          <CardDescription>
            Token market data from GeckoTerminal
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-center text-muted-foreground py-6">
            <p>{error || "Could not load market data for this token"}</p>
            <p className="text-sm mt-2">This token may not be listed on major exchanges yet</p>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-4"
              onClick={handleRetry}
            >
              <Loader2 className={cn("h-4 w-4 mr-2", retryCount > 0 && loading ? "animate-spin" : "opacity-0")} />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Extract data safely with fallbacks
  const { tokenData: token, poolData } = tokenData;
  
  if (!token) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Market Data</CardTitle>
          <CardDescription>
            Token market data from GeckoTerminal
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-center text-muted-foreground py-6">
            <p>No market data available for this token</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{token.name || "Unknown Token"}</span>
          <Badge variant="outline">{token.symbol || "???"}</Badge>
        </CardTitle>
        <CardDescription>
          Token market data from GeckoTerminal
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            {poolData && <TabsTrigger value="liquidity">Liquidity</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Price (USD)</p>
                <p className="text-2xl font-bold">
                  {token.price_usd ? formatCurrency(token.price_usd) : 'N/A'}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">24h Volume</p>
                <p className="text-2xl font-bold">
                  {token.volume_usd?.h24 ? formatCurrency(token.volume_usd.h24) : 'N/A'}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Market Cap</p>
                <p className="text-xl font-semibold">
                  {token.market_cap_usd ? formatCurrency(token.market_cap_usd) : 'N/A'}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fully Diluted Valuation</p>
                <p className="text-xl font-semibold">
                  {token.fdv_usd ? formatCurrency(token.fdv_usd) : 'N/A'}
                </p>
              </div>
            </div>

            {/* Quick social media links section on Overview tab */}
            {hasSocialMedia(socials) && (
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
                {socials.twitter_username && (
                  <a 
                    href={formatSocialLink('twitter', socials.twitter_username)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-full transition-colors"
                  >
                    <Twitter className="h-4 w-4" />
                    <span className="text-sm">Twitter</span>
                  </a>
                )}
                
                {socials.website_url && (
                  <a 
                    href={formatSocialLink('website', socials.website_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-400 rounded-full transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="text-sm">Website</span>
                  </a>
                )}

                {socials.telegram_handle && (
                  <a 
                    href={formatSocialLink('telegram', socials.telegram_handle)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-100 hover:bg-sky-200 dark:bg-sky-900/30 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-400 rounded-full transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm">Telegram</span>
                  </a>
                )}
                
                {socials.facebook_username && (
                  <a 
                    href={formatSocialLink('facebook', socials.facebook_username)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-400 rounded-full transition-colors"
                  >
                    <Facebook className="h-4 w-4" />
                    <span className="text-sm">Facebook</span>
                  </a>
                )}
                
                {socials.discord_url && (
                  <a 
                    href={socials.discord_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-full transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-indigo-500">
                      <path d="M9.55 9.26C9.07 9.26 8.69 9.68 8.69 10.2C8.69 10.71 9.08 11.14 9.55 11.14C10.03 11.14 10.41 10.71 10.41 10.2C10.42 9.68 10.03 9.26 9.55 9.26ZM14.45 9.26C13.97 9.26 13.59 9.68 13.59 10.2C13.59 10.71 13.97 11.14 14.45 11.14C14.93 11.14 15.31 10.71 15.31 10.2C15.31 9.68 14.93 9.26 14.45 9.26Z" fill="currentColor" />
                      <path d="M19.54 0H4.46C2 0 0 2 0 4.47V16.91C0 19.38 2 21.38 4.46 21.38H17.07L16.38 19.16L18.05 20.69L19.6 22.11L23 25V4.47C23 2 21 0 19.54 0ZM15.24 16.31C15.24 16.31 14.76 15.74 14.35 15.23C16.07 14.73 16.76 13.62 16.76 13.62C16.18 14 15.64 14.24 15.17 14.42C14.5 14.67 13.86 14.85 13.24 14.94C11.95 15.15 10.76 15.08 9.75 14.89C8.96 14.73 8.28 14.5 7.7 14.26C7.38 14.13 7.03 13.97 6.68 13.76C6.64 13.74 6.59 13.71 6.55 13.69C6.53 13.68 6.52 13.67 6.5 13.66C6.25 13.53 6.11 13.43 6.11 13.43C6.11 13.43 6.77 14.51 8.44 15.02C8.03 15.53 7.54 16.11 7.54 16.11C4.78 16.02 3.72 14.24 3.72 14.24C3.72 10.28 5.63 7.06 5.63 7.06C7.55 5.59 9.37 5.62 9.37 5.62L9.51 5.79C7.25 6.42 6.21 7.39 6.21 7.39C6.21 7.39 6.5 7.23 6.96 7C8.18 6.45 9.34 6.3 9.75 6.26C9.83 6.25 9.89 6.23 9.96 6.23C10.72 6.12 11.58 6.09 12.48 6.2C13.68 6.33 14.96 6.7 16.27 7.39C16.27 7.39 15.27 6.47 13.13 5.84L13.33 5.61C13.33 5.61 15.15 5.58 17.07 7.05C17.07 7.05 18.98 10.27 18.98 14.23C18.98 14.24 17.92 16.02 15.24 16.31Z" fill="currentColor" />
                    </svg>
                    <span className="text-sm">Discord/Reddit</span>
                  </a>
                )}
                
                {socials.linkedin_url && (
                  <a 
                    href={formatSocialLink('linkedin', socials.linkedin_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700/20 hover:bg-blue-700/30 dark:bg-blue-700/20 dark:hover:bg-blue-700/30 text-blue-700 dark:text-blue-300 rounded-full transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                    <span className="text-sm">LinkedIn</span>
                  </a>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="social" className="space-y-4">
            <div className="space-y-3">
              {socials.twitter_username && (
                <div className="flex items-center gap-2 p-3 bg-card/60 rounded-lg hover:bg-card/80">
                  <div className="bg-blue-500/20 p-2 rounded-full">
                    <Twitter className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Twitter</p>
                    <a 
                      href={formatSocialLink('twitter', socials.twitter_username)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-sm"
                    >
                      @{socials.twitter_username}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
              
              {socials.telegram_handle && (
                <div className="flex items-center gap-2 p-3 bg-card/60 rounded-lg hover:bg-card/80">
                  <div className="bg-sky-500/20 p-2 rounded-full">
                    <MessageCircle className="h-5 w-5 text-sky-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Telegram</p>
                    <a 
                      href={formatSocialLink('telegram', socials.telegram_handle)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-sm"
                    >
                      {socials.telegram_handle}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
              
              {socials.website_url && (
                <div className="flex items-center gap-2 p-3 bg-card/60 rounded-lg hover:bg-card/80">
                  <div className="bg-purple-500/20 p-2 rounded-full">
                    <Globe className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Website</p>
                    <a 
                      href={formatSocialLink('website', socials.website_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-sm"
                    >
                      {socials.website_url.replace(/^https?:\/\/(www\.)?/, '')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
              
              {socials.discord_url && (
                <div className="flex items-center gap-2 p-3 bg-card/60 rounded-lg hover:bg-card/80">
                  <div className="bg-indigo-500/20 p-2 rounded-full">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-indigo-500">
                      <path d="M9.55 9.26C9.07 9.26 8.69 9.68 8.69 10.2C8.69 10.71 9.08 11.14 9.55 11.14C10.03 11.14 10.41 10.71 10.41 10.2C10.42 9.68 10.03 9.26 9.55 9.26ZM14.45 9.26C13.97 9.26 13.59 9.68 13.59 10.2C13.59 10.71 13.97 11.14 14.45 11.14C14.93 11.14 15.31 10.71 15.31 10.2C15.31 9.68 14.93 9.26 14.45 9.26Z" fill="currentColor" />
                      <path d="M19.54 0H4.46C2 0 0 2 0 4.47V16.91C0 19.38 2 21.38 4.46 21.38H17.07L16.38 19.16L18.05 20.69L19.6 22.11L23 25V4.47C23 2 21 0 19.54 0ZM15.24 16.31C15.24 16.31 14.76 15.74 14.35 15.23C16.07 14.73 16.76 13.62 16.76 13.62C16.18 14 15.64 14.24 15.17 14.42C14.5 14.67 13.86 14.85 13.24 14.94C11.95 15.15 10.76 15.08 9.75 14.89C8.96 14.73 8.28 14.5 7.7 14.26C7.38 14.13 7.03 13.97 6.68 13.76C6.64 13.74 6.59 13.71 6.55 13.69C6.53 13.68 6.52 13.67 6.5 13.66C6.25 13.53 6.11 13.43 6.11 13.43C6.11 13.43 6.77 14.51 8.44 15.02C8.03 15.53 7.54 16.11 7.54 16.11C4.78 16.02 3.72 14.24 3.72 14.24C3.72 10.28 5.63 7.06 5.63 7.06C7.55 5.59 9.37 5.62 9.37 5.62L9.51 5.79C7.25 6.42 6.21 7.39 6.21 7.39C6.21 7.39 6.5 7.23 6.96 7C8.18 6.45 9.34 6.3 9.75 6.26C9.83 6.25 9.89 6.23 9.96 6.23C10.72 6.12 11.58 6.09 12.48 6.2C13.68 6.33 14.96 6.7 16.27 7.39C16.27 7.39 15.27 6.47 13.13 5.84L13.33 5.61C13.33 5.61 15.15 5.58 17.07 7.05C17.07 7.05 18.98 10.27 18.98 14.23C18.98 14.24 17.92 16.02 15.24 16.31Z" fill="currentColor" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Discord/Reddit</p>
                    <a 
                      href={socials.discord_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-sm"
                    >
                      {socials.discord_url.includes('discord') ? 'Discord Server' : 'Reddit Community'}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {socials.facebook_username && (
                <div className="flex items-center gap-2 p-3 bg-card/60 rounded-lg hover:bg-card/80">
                  <div className="bg-blue-600/20 p-2 rounded-full">
                    <Facebook className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Facebook</p>
                    <a 
                      href={formatSocialLink('facebook', socials.facebook_username)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-sm"
                    >
                      {socials.facebook_username}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {socials.linkedin_url && (
                <div className="flex items-center gap-2 p-3 bg-card/60 rounded-lg hover:bg-card/80">
                  <div className="bg-blue-700/20 p-2 rounded-full">
                    <Linkedin className="h-5 w-5 text-blue-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">LinkedIn</p>
                    <a 
                      href={formatSocialLink('linkedin', socials.linkedin_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-sm"
                    >
                      Company Profile
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {!hasSocialMedia(socials) && (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="h-8 w-8 text-muted-foreground/70" />
                    <p>No social media accounts found.</p>
                    <p className="text-sm mt-2">This project may not have registered their social profiles.</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {poolData && (
            <TabsContent value="liquidity" className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Pool</p>
                <p className="font-medium">{poolData.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pool Price (USD)</p>
                  <p className="text-xl font-semibold">
                    {poolData.token_price_usd ? formatCurrency(poolData.token_price_usd) : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">24h Volume</p>
                  <p className="text-xl font-semibold">
                    {poolData.volume_usd?.h24 ? formatCurrency(poolData.volume_usd.h24) : 'N/A'}
                  </p>
                </div>
              </div>
              
              {poolData.transactions?.h24 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">24h Transactions</p>
                  <div className="flex gap-4">
                    <div className="bg-green-100 dark:bg-green-950 px-3 py-1 rounded-md">
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                        {poolData.transactions.h24.buys} buys
                      </span>
                    </div>
                    <div className="bg-red-100 dark:bg-red-950 px-3 py-1 rounded-md">
                      <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                        {poolData.transactions.h24.sells} sells
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TokenGeckoDetails;
