import type { Credentials, ApiResponse, CampaignsResponse, CampaignData, AuditResult } from '../types';

const API_BASE = '/api';

// Extended report types
export interface AllReportsData {
    campaigns: CampaignData[];
    geographic: any[];
    devices: any[];
    searchTerms: any[];
    qualityScores: any[];
    auctionInsights: any[];
    conversionActions: any[];
    landingPages: any[];
    shoppingProducts: any[];
    productGroups: any[];
    assetGroups: any[];
    changeHistory: any[];
    keywords: any[];
    negativeKeywords: any[];
}

/**
 * Fetch campaigns from Google Ads
 */
export async function fetchCampaigns(
    credentials: Credentials
): Promise<CampaignsResponse> {
    const response = await fetch(`${API_BASE}/google-ads/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            refreshToken: credentials.refreshToken,
            clientId: credentials.clientId,
            clientSecret: credentials.clientSecret,
            developerToken: credentials.developerToken,
            customerId: credentials.customerId,
            loginCustomerId: credentials.loginCustomerId || undefined,
            startDate: credentials.startDate || undefined,
            endDate: credentials.endDate || undefined,
        }),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('API Error: Received non-JSON response:', text.substring(0, 500));
        throw new Error(`API result is not JSON (Status: ${response.status}). Check console for details.`);
    }

    const result: ApiResponse<CampaignsResponse> = await response.json();

    if (!result.success || !result.data) {
        throw new Error(result.message || result.error || 'Failed to fetch campaigns');
    }

    return result.data;
}

/**
 * Fetch a single report with detailed logging
 */
async function fetchReport(credentials: Credentials, endpoint: string): Promise<any[]> {
    console.log(`[AdPulse] Fetching report: ${endpoint}`);
    try {
        const response = await fetch(`${API_BASE}/reports/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                refreshToken: credentials.refreshToken,
                clientId: credentials.clientId,
                clientSecret: credentials.clientSecret,
                developerToken: credentials.developerToken,
                customerId: credentials.customerId,
                loginCustomerId: credentials.loginCustomerId || undefined,
                startDate: credentials.startDate,
                endDate: credentials.endDate,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[AdPulse] ${endpoint} API error (${response.status}):`, errorText.substring(0, 200));
            return [];
        }

        const result = await response.json();
        const data = result.success ? result.data?.results || [] : [];
        console.log(`[AdPulse] ${endpoint}: ${data.length} records`);
        return data;
    } catch (err) {
        console.error(`[AdPulse] Failed to fetch ${endpoint}:`, err);
        return [];
    }
}

/**
 * Fetch all reports in parallel with progress logging
 */
export async function fetchAllReports(credentials: Credentials): Promise<AllReportsData> {
    console.log('[AdPulse] Starting to fetch all reports...');
    const campaignsResp = await fetchCampaigns(credentials);
    console.log(`[AdPulse] Campaigns: ${campaignsResp.campaigns.length} records`);

    const [
        geographic, devices, searchTerms, qualityScores,
        auctionInsights, conversionActions, landingPages,
        shoppingProducts, productGroups, assetGroups, changeHistory,
        keywords, negativeKeywords
    ] = await Promise.all([
        fetchReport(credentials, 'geographic'),
        fetchReport(credentials, 'devices'),
        fetchReport(credentials, 'search-terms'),
        fetchReport(credentials, 'quality-scores'),
        fetchReport(credentials, 'auction-insights'),
        fetchReport(credentials, 'conversion-actions'),
        fetchReport(credentials, 'landing-pages'),
        fetchReport(credentials, 'shopping-products'),
        fetchReport(credentials, 'product-groups'),
        fetchReport(credentials, 'asset-groups'),
        fetchReport(credentials, 'change-history'),
        fetchReport(credentials, 'keywords'),
        fetchReport(credentials, 'negative-keywords'),
    ]);

    const allReports: AllReportsData = {
        campaigns: campaignsResp.campaigns,
        geographic, devices, searchTerms, qualityScores,
        auctionInsights, conversionActions, landingPages,
        shoppingProducts, productGroups, assetGroups, changeHistory,
        keywords, negativeKeywords
    };

    // Summary log
    console.log('[AdPulse] All reports fetched:');
    console.log(`  - Geographic: ${geographic.length}`);
    console.log(`  - Devices: ${devices.length}`);
    console.log(`  - Search Terms: ${searchTerms.length}`);
    console.log(`  - Quality Scores: ${qualityScores.length}`);
    console.log(`  - Auction Insights: ${auctionInsights.length}`);
    console.log(`  - Conversion Actions: ${conversionActions.length}`);
    console.log(`  - Landing Pages: ${landingPages.length}`);
    console.log(`  - Shopping Products: ${shoppingProducts.length}`);
    console.log(`  - Product Groups: ${productGroups.length}`);
    console.log(`  - Asset Groups: ${assetGroups.length}`);
    console.log(`  - Change History: ${changeHistory.length}`);
    console.log(`  - Keywords: ${keywords.length}`);
    console.log(`  - Negative Keywords: ${negativeKeywords.length}`);

    return allReports;
}

/**
 * Convert data to CSV and trigger download
 */
export function exportToCSV(data: AllReportsData, filename: string = 'adpulse_report.csv') {
    const sections: string[] = [];

    // Helper to convert array to CSV section
    const toCSVSection = (title: string, arr: any[]) => {
        if (!arr.length) return '';
        const headers = Object.keys(arr[0]);
        const rows = arr.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','));
        return `\n--- ${title} ---\n${headers.join(',')}\n${rows.join('\n')}`;
    };

    sections.push(toCSVSection('CAMPAIGNS', data.campaigns));
    sections.push(toCSVSection('GEOGRAPHIC', data.geographic));
    sections.push(toCSVSection('DEVICES', data.devices));
    sections.push(toCSVSection('SEARCH TERMS', data.searchTerms));
    sections.push(toCSVSection('QUALITY SCORES', data.qualityScores));
    sections.push(toCSVSection('AUCTION INSIGHTS', data.auctionInsights));
    sections.push(toCSVSection('CONVERSION ACTIONS', data.conversionActions));
    sections.push(toCSVSection('LANDING PAGES', data.landingPages));
    sections.push(toCSVSection('SHOPPING PRODUCTS', data.shoppingProducts));
    sections.push(toCSVSection('PRODUCT GROUPS', data.productGroups));
    sections.push(toCSVSection('ASSET GROUPS', data.assetGroups));
    sections.push(toCSVSection('CHANGE HISTORY', data.changeHistory));
    sections.push(toCSVSection('KEYWORDS', data.keywords));
    sections.push(toCSVSection('NEGATIVE KEYWORDS', data.negativeKeywords));

    const csv = sections.filter(Boolean).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Generate AI audit
 */
export async function generateAudit(
    campaigns: CampaignData[],
    openaiApiKey: string,
    dateRange?: { startDate: string; endDate: string }
): Promise<AuditResult> {
    const response = await fetch(`${API_BASE}/audit/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaigns, openaiApiKey, dateRange }),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`API result is not JSON (Status: ${response.status}). Check console for details.`);
    }

    const result: ApiResponse<AuditResult> = await response.json();

    if (!result.success || !result.data) {
        throw new Error(result.message || result.error || 'Failed to generate audit');
    }

    return result.data;
}

/**
 * Generate comprehensive AI audit using all report data
 */
export async function generateComprehensiveAudit(
    allReports: AllReportsData,
    openaiApiKey: string,
    dateRange?: { startDate: string; endDate: string }
): Promise<AuditResult> {
    const response = await fetch(`${API_BASE}/audit/comprehensive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allReports, openaiApiKey, dateRange }),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`API result is not JSON (Status: ${response.status})`);
    }

    const result: ApiResponse<AuditResult> = await response.json();

    if (!result.success || !result.data) {
        throw new Error(result.message || result.error || 'Failed to generate comprehensive audit');
    }

    return result.data;
}

