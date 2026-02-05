import type { TokenResponse, GoogleAdsCredentials, CampaignData } from '../types/index.js';

const GOOGLE_ADS_API_VERSION = 'v19';
const GOOGLE_ADS_BASE_URL = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

// GAQL query - Extended with conversion value and bid strategy details
const CAMPAIGN_QUERY = `
SELECT 
  campaign.id, campaign.name, campaign.status, 
  campaign.advertising_channel_type, campaign_budget.amount_micros,
  campaign_budget.total_amount_micros,
  campaign.bidding_strategy_type,
  campaign.target_cpa.target_cpa_micros,
  campaign.maximize_conversions.target_cpa_micros,
  campaign.target_roas.target_roas,
  campaign.maximize_conversion_value.target_roas,
  metrics.impressions, metrics.clicks, metrics.cost_micros, 
  metrics.conversions, metrics.conversions_value,
  metrics.ctr, metrics.average_cpc
FROM campaign 
WHERE segments.date DURING LAST_30_DAYS 
AND campaign.status != 'REMOVED'
`;

/**
 * Exchange refresh token for access token
 */
export async function getAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
): Promise<TokenResponse> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        try {
            const error = JSON.parse(text);
            throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
        } catch (e) {
            // Use the raw text if JSON parse fails (e.g. HTML response)
            throw new Error(`Token exchange failed: ${text.substring(0, 200)}...`);
        }
    }

    const data = await response.json();
    return {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
    };
}

/**
 * Fetch campaign data using GAQL query
 */
export async function fetchCampaigns(
    accessToken: string,
    credentials: GoogleAdsCredentials,
    dateRange?: { startDate: string; endDate: string }
): Promise<CampaignData[]> {
    const customerId = credentials.customerId.replace(/-/g, ''); // Remove dashes

    const headers: Record<string, string> = {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': credentials.developerToken,
        'Content-Type': 'application/json',
    };

    // Add login-customer-id for MCC accounts
    if (credentials.loginCustomerId) {
        headers['login-customer-id'] = credentials.loginCustomerId.replace(/-/g, '');
    }

    const url = `${GOOGLE_ADS_BASE_URL}/customers/${customerId}/googleAds:search`;
    console.log(`[GoogleAds] Requesting: ${url}`);

    // Construct query with dynamic date range
    let query = CAMPAIGN_QUERY;
    if (dateRange?.startDate && dateRange?.endDate) {
        query = query.replace(
            'DURING LAST_30_DAYS',
            `BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'`
        );
        console.log(`[GoogleAds] Using custom date range: ${dateRange.startDate} to ${dateRange.endDate}`);
    } else {
        console.log('[GoogleAds] Using default date range: LAST_30_DAYS');
    }

    const response = await fetch(
        url,
        {
            method: 'POST',
            headers,
            body: JSON.stringify({ query }),
        }
    );

    if (!response.ok) {
        const text = await response.text();
        try {
            const error = JSON.parse(text);
            throw new Error(
                `Google Ads API error: ${error.error?.message || JSON.stringify(error)}`
            );
        } catch (e) {
            throw new Error(`Google Ads API error (non-JSON): ${text.substring(0, 200)}...`);
        }
    }

    const data = await response.json();
    console.log(`[GoogleAds] Raw rows returned: ${data.results?.length || 0}`);
    if (data.results && data.results.length > 0) {
        console.log('[GoogleAds] First row sample:', JSON.stringify(data.results[0], null, 2));
    }
    return transformCampaignData(data.results || []);
}

/**
 * Transform raw Google Ads response to structured CampaignData
 * Handles micro-currency conversion (divide by 1,000,000)
 */
function transformCampaignData(results: any[]): CampaignData[] {
    return results.map((result) => {
        const clicks = Number(result.metrics?.clicks) || 0;
        const conversions = Number(result.metrics?.conversions) || 0;

        // Get target CPA from either target_cpa or maximize_conversions
        const targetCpaMicros = result.campaign?.targetCpa?.targetCpaMicros
            || result.campaign?.maximizeConversions?.targetCpaMicros
            || null;

        // Get target ROAS from either target_roas or maximize_conversion_value
        const targetRoas = result.campaign?.targetRoas?.targetRoas
            || result.campaign?.maximizeConversionValue?.targetRoas
            || null;

        return {
            id: result.campaign?.id || '',
            name: result.campaign?.name || '',
            status: result.campaign?.status || 'REMOVED',
            channelType: result.campaign?.advertisingChannelType || 'UNKNOWN',
            biddingStrategyType: result.campaign?.biddingStrategyType || 'UNKNOWN',
            dailyBudget: (result.campaignBudget?.amountMicros || 0) / 1_000_000,
            totalBudget: (result.campaignBudget?.totalAmountMicros || 0) / 1_000_000,
            targetCpa: targetCpaMicros ? targetCpaMicros / 1_000_000 : null,
            targetRoas: targetRoas,
            impressions: Number(result.metrics?.impressions) || 0,
            clicks,
            cost: (Number(result.metrics?.costMicros) || 0) / 1_000_000,
            conversions,
            conversionsValue: Number(result.metrics?.conversionsValue) || 0,
            conversionRate: clicks > 0 ? conversions / clicks : 0,
            ctr: Number(result.metrics?.ctr) || 0,
            avgCpc: (Number(result.metrics?.averageCpc) || 0) / 1_000_000,
        };
    });
}
