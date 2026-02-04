import type { Credentials, ApiResponse, CampaignsResponse, CampaignData, AuditResult } from '../types';

const API_BASE = '/api';

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
