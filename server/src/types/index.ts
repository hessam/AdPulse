// Campaign data from Google Ads API
export interface CampaignData {
    id: string;
    name: string;
    status: 'ENABLED' | 'PAUSED' | 'REMOVED';
    channelType: string;
    biddingStrategyType: string;
    dailyBudget: number;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    ctr: number;
    avgCpc: number;
}

// OAuth token response
export interface TokenResponse {
    accessToken: string;
    expiresIn: number;
    tokenType: string;
}

// Credentials from frontend
export interface GoogleAdsCredentials {
    refreshToken: string;
    clientId: string;
    clientSecret: string;
    developerToken: string;
    customerId: string;
    loginCustomerId?: string; // For MCC accounts
    openaiApiKey: string;
}

// AI Audit response
export interface AuditRecommendation {
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    category: string;
    issue: string;
    action: string;
}

export interface AuditResponse {
    summary: string;
    recommendations: AuditRecommendation[];
    cleanReport: string;
}

// API error response
export interface ApiError {
    error: string;
    message: string;
    details?: unknown;
}
