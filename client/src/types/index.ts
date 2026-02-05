// Campaign data from API
export interface CampaignData {
    id: string;
    name: string;
    status: 'ENABLED' | 'PAUSED' | 'REMOVED';
    channelType: string;
    biddingStrategyType: string;
    dailyBudget: number;
    totalBudget: number;
    targetCpa: number | null;
    targetRoas: number | null;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    conversionsValue: number;
    conversionRate: number;
    ctr: number;
    avgCpc: number;
}

// Credentials form
export interface Credentials {
    refreshToken: string;
    clientId: string;
    clientSecret: string;
    developerToken: string;
    customerId: string;
    loginCustomerId: string;
    openaiApiKey: string;
    startDate?: string;
    endDate?: string;
}

// Audit response
export interface AuditRecommendation {
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    category: string;
    issue: string;
    action: string;
}

export interface AuditResult {
    summary: string;
    recommendations: AuditRecommendation[];
    cleanReport: string;
    generatedAt: string;
    campaignCount: number;
}

// API responses
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface CampaignsResponse {
    campaigns: CampaignData[];
    fetchedAt: string;
    count: number;
}
