import type { GoogleAdsCredentials } from '../types/index.js';

const GOOGLE_ADS_API_VERSION = 'v19';
const GOOGLE_ADS_BASE_URL = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

// Date range type for dynamic queries
export interface DateRange {
    startDate: string; // YYYY-MM-DD format
    endDate: string;   // YYYY-MM-DD format
}

// Helper to build date clause for GAQL queries
function buildDateClause(dateRange?: DateRange): string {
    if (dateRange?.startDate && dateRange?.endDate) {
        // Use BETWEEN for custom date range (format: YYYY-MM-DD)
        return `segments.date BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'`;
    }
    // Default: last 30 days
    return 'segments.date DURING LAST_30_DAYS';
}

// ============ REPORT TYPES ============

export interface GeoPerformance {
    countryCode: string;
    campaignName: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
}

export interface DevicePerformance {
    device: string;
    campaignName: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    conversionRate: number;
}

export interface SearchTermData {
    searchTerm: string;
    campaignName: string;
    matchType: string;
    impressions: number;
    clicks: number;
    conversions: number;
    cost: number;
}

export interface KeywordQualityScore {
    keyword: string;
    adGroupName: string;
    qualityScore: number;
    expectedCtr: string;
    adRelevance: string;
    landingPageExperience: string;
}

export interface AuctionInsight {
    campaignName: string;
    impressionShare: number;
    lostIsRank: number;
    lostIsBudget: number;
}

export interface ConversionAction {
    name: string;
    type: string;
    countingType: string;
    attributionModel: string;
}

export interface LandingPageData {
    url: string;
    impressions: number;
    clicks: number;
    conversions: number;
    conversionRate: number;
}

// Phase 4: Complex Types
export interface ShoppingProduct {
    productId: string;
    productTitle: string;
    impressions: number;
    clicks: number;
    conversions: number;
    cost: number;
}

export interface ProductGroup {
    campaignName: string;
    adGroupName: string;
    listingGroupType: string;
    cpcBid: number;
}

export interface AssetGroup {
    campaignName: string;
    assetGroupName: string;
    status: string;
}

export interface ChangeEvent {
    changeDateTime: string;
    resourceType: string;
    userEmail: string;
    changedFields: string;
}

// ============ GAQL QUERIES ============
// Fixed for Google Ads API v19 syntax

const QUERIES = {
    // Geographic Performance - using user_location_view for actual user locations
    geographic: `
        SELECT 
            campaign.name,
            user_location_view.country_criterion_id,
            metrics.impressions, 
            metrics.clicks, 
            metrics.conversions, 
            metrics.cost_micros
        FROM user_location_view 
        WHERE segments.date DURING LAST_30_DAYS
    `,

    // Device Performance - segments.device works with campaign resource
    device: `
        SELECT 
            campaign.name, 
            segments.device,
            metrics.impressions, 
            metrics.clicks, 
            metrics.conversions, 
            metrics.cost_micros
        FROM campaign 
        WHERE segments.date DURING LAST_30_DAYS
        AND campaign.status != 'REMOVED'
    `,

    // Search Terms - correct syntax
    searchTerms: `
        SELECT 
            search_term_view.search_term, 
            campaign.name,
            metrics.impressions, 
            metrics.clicks, 
            metrics.conversions, 
            metrics.cost_micros
        FROM search_term_view 
        WHERE segments.date DURING LAST_30_DAYS
        ORDER BY metrics.impressions DESC
        LIMIT 200
    `,

    // Negative Keywords at campaign level
    negativeKeywords: `
        SELECT 
            campaign.name, 
            campaign_criterion.keyword.text,
            campaign_criterion.keyword.match_type
        FROM campaign_criterion
        WHERE campaign_criterion.type = 'KEYWORD' 
        AND campaign_criterion.negative = TRUE
    `,

    // Quality Score - filter for keywords that actually have quality scores
    qualityScore: `
        SELECT 
            campaign.name,
            ad_group.name, 
            ad_group_criterion.keyword.text,
            ad_group_criterion.quality_info.quality_score,
            ad_group_criterion.quality_info.creative_quality_score,
            ad_group_criterion.quality_info.search_predicted_ctr,
            ad_group_criterion.quality_info.post_click_quality_score
        FROM keyword_view 
        WHERE ad_group_criterion.status = 'ENABLED'
        AND ad_group_criterion.quality_info.quality_score IS NOT NULL
        LIMIT 50
    `,

    // Auction Insights - search_impression_share on campaign
    auctionInsights: `
        SELECT 
            campaign.name, 
            metrics.search_impression_share,
            metrics.search_rank_lost_impression_share,
            metrics.search_budget_lost_impression_share,
            metrics.impressions,
            metrics.clicks
        FROM campaign 
        WHERE segments.date DURING LAST_30_DAYS
        AND campaign.status = 'ENABLED'
        AND campaign.advertising_channel_type = 'SEARCH'
    `,

    // Conversion Actions - no date filter, just config
    conversionActions: `
        SELECT 
            conversion_action.name, 
            conversion_action.type,
            conversion_action.status,
            conversion_action.category
        FROM conversion_action
        WHERE conversion_action.status = 'ENABLED'
    `,

    // Landing Pages
    landingPages: `
        SELECT 
            landing_page_view.unexpanded_final_url,
            metrics.impressions, 
            metrics.clicks, 
            metrics.conversions
        FROM landing_page_view 
        WHERE segments.date DURING LAST_30_DAYS
        ORDER BY metrics.clicks DESC
        LIMIT 50
    `,

    // Shopping Performance
    shoppingPerformance: `
        SELECT 
            segments.product_item_id, 
            segments.product_title,
            metrics.impressions, 
            metrics.clicks, 
            metrics.conversions, 
            metrics.cost_micros
        FROM shopping_performance_view 
        WHERE segments.date DURING LAST_30_DAYS
        ORDER BY metrics.impressions DESC
        LIMIT 50
    `,

    // Product Groups (Shopping/PMax listing groups)
    productGroups: `
        SELECT 
            campaign.name, 
            ad_group.name, 
            ad_group_criterion.listing_group.type,
            ad_group_criterion.cpc_bid_micros
        FROM ad_group_criterion 
        WHERE ad_group_criterion.type = 'LISTING_GROUP'
        AND ad_group_criterion.status != 'REMOVED'
    `,

    // Asset Groups (PMax)
    assetGroups: `
        SELECT 
            campaign.name, 
            asset_group.name, 
            asset_group.status
        FROM asset_group
        WHERE asset_group.status != 'REMOVED'
    `,

    // Change History - requires specific access, may fail on some accounts
    changeHistory: `
        SELECT 
            change_event.change_date_time, 
            change_event.change_resource_type,
            change_event.user_email
        FROM change_event 
        WHERE change_event.change_date_time DURING LAST_14_DAYS
        ORDER BY change_event.change_date_time DESC
        LIMIT 50
    `,
};

// ============ GENERIC QUERY EXECUTOR ============

async function executeQuery(
    accessToken: string,
    credentials: GoogleAdsCredentials,
    query: string
): Promise<any[]> {
    const customerId = credentials.customerId.replace(/-/g, '');

    const headers: Record<string, string> = {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': credentials.developerToken,
        'Content-Type': 'application/json',
    };

    if (credentials.loginCustomerId) {
        headers['login-customer-id'] = credentials.loginCustomerId.replace(/-/g, '');
    }

    const url = `${GOOGLE_ADS_BASE_URL}/customers/${customerId}/googleAds:search`;

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Google Ads API error: ${text.substring(0, 300)}`);
    }

    const data = await response.json() as { results?: any[] };
    return data.results || [];
}

// ============ REPORT FUNCTIONS ============

export async function fetchGeoPerformance(
    accessToken: string,
    credentials: GoogleAdsCredentials,
    dateRange?: DateRange
): Promise<GeoPerformance[]> {
    const dateClause = buildDateClause(dateRange);
    const query = `
        SELECT 
            campaign.name,
            user_location_view.country_criterion_id,
            metrics.impressions, 
            metrics.clicks, 
            metrics.conversions, 
            metrics.cost_micros
        FROM user_location_view 
        WHERE ${dateClause}
    `;
    const results = await executeQuery(accessToken, credentials, query);
    return results.map((r: any) => ({
        countryCode: r.userLocationView?.countryCriterionId || 'UNKNOWN',
        campaignName: r.campaign?.name || '',
        impressions: Number(r.metrics?.impressions) || 0,
        clicks: Number(r.metrics?.clicks) || 0,
        cost: (Number(r.metrics?.costMicros) || 0) / 1_000_000,
        conversions: Number(r.metrics?.conversions) || 0,
    }));
}

export async function fetchDevicePerformance(
    accessToken: string,
    credentials: GoogleAdsCredentials,
    dateRange?: DateRange
): Promise<DevicePerformance[]> {
    const dateClause = buildDateClause(dateRange);
    const query = `
        SELECT 
            campaign.name, 
            segments.device,
            metrics.impressions, 
            metrics.clicks, 
            metrics.conversions, 
            metrics.cost_micros
        FROM campaign 
        WHERE ${dateClause}
        AND campaign.status != 'REMOVED'
    `;
    const results = await executeQuery(accessToken, credentials, query);
    return results.map((r: any) => {
        const clicks = Number(r.metrics?.clicks) || 0;
        const conversions = Number(r.metrics?.conversions) || 0;
        return {
            device: r.segments?.device || 'UNKNOWN',
            campaignName: r.campaign?.name || '',
            impressions: Number(r.metrics?.impressions) || 0,
            clicks,
            cost: (Number(r.metrics?.costMicros) || 0) / 1_000_000,
            conversions,
            conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
        };
    });
}

export async function fetchSearchTerms(
    accessToken: string,
    credentials: GoogleAdsCredentials,
    dateRange?: DateRange
): Promise<SearchTermData[]> {
    const dateClause = buildDateClause(dateRange);
    const query = `
        SELECT 
            search_term_view.search_term, 
            campaign.name,
            metrics.impressions, 
            metrics.clicks, 
            metrics.conversions, 
            metrics.cost_micros
        FROM search_term_view 
        WHERE ${dateClause}
        ORDER BY metrics.impressions DESC
        LIMIT 200
    `;
    const results = await executeQuery(accessToken, credentials, query);
    return results.map((r: any) => ({
        searchTerm: r.searchTermView?.searchTerm || '',
        campaignName: r.campaign?.name || '',
        matchType: 'N/A',
        impressions: Number(r.metrics?.impressions) || 0,
        clicks: Number(r.metrics?.clicks) || 0,
        conversions: Number(r.metrics?.conversions) || 0,
        cost: (Number(r.metrics?.costMicros) || 0) / 1_000_000,
    }));
}

export async function fetchQualityScores(
    accessToken: string,
    credentials: GoogleAdsCredentials,
    dateRange?: DateRange
): Promise<KeywordQualityScore[]> {
    // Quality score doesn't use date range - it's current snapshot
    const results = await executeQuery(accessToken, credentials, QUERIES.qualityScore);
    return results.map((r: any) => ({
        keyword: r.adGroupCriterion?.keyword?.text || '',
        adGroupName: r.adGroup?.name || '',
        qualityScore: Number(r.adGroupCriterion?.qualityInfo?.qualityScore) || 0,
        expectedCtr: r.adGroupCriterion?.qualityInfo?.searchPredictedCtr || 'UNKNOWN',
        adRelevance: r.adGroupCriterion?.qualityInfo?.creativeQualityScore || 'UNKNOWN',
        landingPageExperience: r.adGroupCriterion?.qualityInfo?.postClickQualityScore || 'UNKNOWN',
    }));
}

export async function fetchAuctionInsights(
    accessToken: string,
    credentials: GoogleAdsCredentials,
    dateRange?: DateRange
): Promise<AuctionInsight[]> {
    const dateClause = buildDateClause(dateRange);
    const query = `
        SELECT 
            campaign.name, 
            metrics.search_impression_share,
            metrics.search_rank_lost_impression_share,
            metrics.search_budget_lost_impression_share,
            metrics.impressions,
            metrics.clicks
        FROM campaign 
        WHERE ${dateClause}
        AND campaign.status = 'ENABLED'
        AND campaign.advertising_channel_type = 'SEARCH'
    `;
    const results = await executeQuery(accessToken, credentials, query);
    return results.map((r: any) => ({
        campaignName: r.campaign?.name || '',
        impressionShare: Number(r.metrics?.searchImpressionShare) || 0,
        lostIsRank: Number(r.metrics?.searchRankLostImpressionShare) || 0,
        lostIsBudget: Number(r.metrics?.searchBudgetLostImpressionShare) || 0,
    }));
}

export async function fetchConversionActions(
    accessToken: string,
    credentials: GoogleAdsCredentials
): Promise<ConversionAction[]> {
    const results = await executeQuery(accessToken, credentials, QUERIES.conversionActions);
    return results.map((r: any) => ({
        name: r.conversionAction?.name || '',
        type: r.conversionAction?.type || 'UNKNOWN',
        countingType: r.conversionAction?.countingType || 'UNKNOWN',
        attributionModel: r.conversionAction?.attributionModelSettings?.attributionModel || 'UNKNOWN',
    }));
}

export async function fetchLandingPages(
    accessToken: string,
    credentials: GoogleAdsCredentials,
    dateRange?: DateRange
): Promise<LandingPageData[]> {
    const dateClause = buildDateClause(dateRange);
    const query = `
        SELECT 
            landing_page_view.unexpanded_final_url,
            metrics.impressions, 
            metrics.clicks, 
            metrics.conversions
        FROM landing_page_view 
        WHERE ${dateClause}
        ORDER BY metrics.clicks DESC
        LIMIT 50
    `;
    const results = await executeQuery(accessToken, credentials, query);
    return results.map((r: any) => {
        const clicks = Number(r.metrics?.clicks) || 0;
        const conversions = Number(r.metrics?.conversions) || 0;
        return {
            url: r.landingPageView?.unexpandedFinalUrl || '',
            impressions: Number(r.metrics?.impressions) || 0,
            clicks,
            conversions,
            conversionRate: clicks > 0 ? conversions / clicks : 0,
        };
    });
}

// ============ PHASE 4: COMPLEX REPORT FUNCTIONS ============

export async function fetchShoppingProducts(
    accessToken: string,
    credentials: GoogleAdsCredentials,
    dateRange?: DateRange
): Promise<ShoppingProduct[]> {
    const dateClause = buildDateClause(dateRange);
    const query = `
        SELECT 
            segments.product_item_id, 
            segments.product_title,
            metrics.impressions, 
            metrics.clicks, 
            metrics.conversions, 
            metrics.cost_micros
        FROM shopping_performance_view 
        WHERE ${dateClause}
        ORDER BY metrics.impressions DESC
        LIMIT 50
    `;
    const results = await executeQuery(accessToken, credentials, query);
    return results.map((r: any) => ({
        productId: r.segments?.productItemId || '',
        productTitle: r.segments?.productTitle || '',
        impressions: Number(r.metrics?.impressions) || 0,
        clicks: Number(r.metrics?.clicks) || 0,
        conversions: Number(r.metrics?.conversions) || 0,
        cost: (Number(r.metrics?.costMicros) || 0) / 1_000_000,
    }));
}

export async function fetchProductGroups(
    accessToken: string,
    credentials: GoogleAdsCredentials
): Promise<ProductGroup[]> {
    const results = await executeQuery(accessToken, credentials, QUERIES.productGroups);
    return results.map((r: any) => ({
        campaignName: r.campaign?.name || '',
        adGroupName: r.adGroup?.name || '',
        listingGroupType: r.adGroupCriterion?.listingGroup?.type || 'UNKNOWN',
        cpcBid: (Number(r.adGroupCriterion?.cpcBidMicros) || 0) / 1_000_000,
    }));
}

export async function fetchAssetGroups(
    accessToken: string,
    credentials: GoogleAdsCredentials
): Promise<AssetGroup[]> {
    const results = await executeQuery(accessToken, credentials, QUERIES.assetGroups);
    return results.map((r: any) => ({
        campaignName: r.campaign?.name || '',
        assetGroupName: r.assetGroup?.name || '',
        status: r.assetGroup?.status || 'UNKNOWN',
    }));
}

export async function fetchChangeHistory(
    accessToken: string,
    credentials: GoogleAdsCredentials
): Promise<ChangeEvent[]> {
    const results = await executeQuery(accessToken, credentials, QUERIES.changeHistory);
    return results.map((r: any) => ({
        changeDateTime: r.changeEvent?.changeDateTime || '',
        resourceType: r.changeEvent?.changeResourceType || 'UNKNOWN',
        userEmail: r.changeEvent?.userEmail || '',
        changedFields: r.changeEvent?.changedFields || '',
    }));
}

// ============ KEYWORD FUNCTIONS ============

export interface Keyword {
    keyword: string;
    adGroupName: string;
    campaignName: string;
    matchType: string;
    impressions: number;
    clicks: number;
    conversions: number;
    cost: number;
}

export interface NegativeKeyword {
    keyword: string;
    campaignName: string;
}

export async function fetchKeywords(
    accessToken: string,
    credentials: GoogleAdsCredentials,
    dateRange?: DateRange
): Promise<Keyword[]> {
    const dateClause = buildDateClause(dateRange);
    const query = `
        SELECT 
            campaign.name, 
            ad_group.name, 
            ad_group_criterion.keyword.text,
            ad_group_criterion.keyword.match_type,
            metrics.impressions, 
            metrics.clicks, 
            metrics.conversions, 
            metrics.cost_micros
        FROM keyword_view 
        WHERE ${dateClause}
        ORDER BY metrics.impressions DESC
        LIMIT 100
    `;
    const results = await executeQuery(accessToken, credentials, query);
    return results.map((r: any) => ({
        keyword: r.adGroupCriterion?.keyword?.text || '',
        adGroupName: r.adGroup?.name || '',
        campaignName: r.campaign?.name || '',
        matchType: r.adGroupCriterion?.keyword?.matchType || 'UNKNOWN',
        impressions: Number(r.metrics?.impressions) || 0,
        clicks: Number(r.metrics?.clicks) || 0,
        conversions: Number(r.metrics?.conversions) || 0,
        cost: (Number(r.metrics?.costMicros) || 0) / 1_000_000,
    }));
}

export async function fetchNegativeKeywords(
    accessToken: string,
    credentials: GoogleAdsCredentials
): Promise<NegativeKeyword[]> {
    const results = await executeQuery(accessToken, credentials, QUERIES.negativeKeywords);
    return results.map((r: any) => ({
        keyword: r.campaignCriterion?.keyword?.text || '',
        campaignName: r.campaign?.name || '',
    }));
}
