import { Router } from 'express';
import { z } from 'zod';
import { getAccessToken } from '../services/googleAdsService.js';
import {
    fetchGeoPerformance,
    fetchDevicePerformance,
    fetchSearchTerms,
    fetchQualityScores,
    fetchAuctionInsights,
    fetchConversionActions,
    fetchLandingPages,
    fetchShoppingProducts,
    fetchProductGroups,
    fetchAssetGroups,
    fetchChangeHistory,
    fetchNegativeKeywords,
    fetchKeywords,
} from '../services/extendedGoogleAdsService.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Shared credential schema with date range
const credentialsSchema = z.object({
    refreshToken: z.string().min(1),
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    developerToken: z.string().min(1),
    customerId: z.string().min(1),
    loginCustomerId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

// Generic handler factory with logging and date range support
function createReportHandler(fetchFn: Function, reportName: string) {
    return async (req: any, res: any, next: any) => {
        console.log(`[Reports] Fetching ${reportName}...`);
        try {
            const credentials = credentialsSchema.parse(req.body);
            const dateRange = credentials.startDate && credentials.endDate
                ? { startDate: credentials.startDate, endDate: credentials.endDate }
                : undefined;

            console.log(`[Reports] ${reportName} date range:`, dateRange || 'LAST_30_DAYS default');

            const tokenResponse = await getAccessToken(
                credentials.refreshToken,
                credentials.clientId,
                credentials.clientSecret
            );

            // Pass date range to fetch function
            const data = await fetchFn(tokenResponse.accessToken, credentials, dateRange);
            console.log(`[Reports] ${reportName}: ${data.length} records`);

            res.json({
                success: true,
                data: {
                    report: reportName,
                    results: data,
                    count: data.length,
                    fetchedAt: new Date().toISOString(),
                },
            });
        } catch (error: any) {
            console.error(`[Reports] ${reportName} error:`, error?.message || error);
            next(error);
        }
    };
}

// Phase 2-3 Routes
router.post('/geographic', apiRateLimiter, createReportHandler(fetchGeoPerformance, 'geographic'));
router.post('/devices', apiRateLimiter, createReportHandler(fetchDevicePerformance, 'devices'));
router.post('/search-terms', apiRateLimiter, createReportHandler(fetchSearchTerms, 'search-terms'));
router.post('/quality-scores', apiRateLimiter, createReportHandler(fetchQualityScores, 'quality-scores'));
router.post('/auction-insights', apiRateLimiter, createReportHandler(fetchAuctionInsights, 'auction-insights'));
router.post('/conversion-actions', apiRateLimiter, createReportHandler(fetchConversionActions, 'conversion-actions'));
router.post('/landing-pages', apiRateLimiter, createReportHandler(fetchLandingPages, 'landing-pages'));
router.post('/keywords', apiRateLimiter, createReportHandler(fetchKeywords, 'keywords'));
router.post('/negative-keywords', apiRateLimiter, createReportHandler(fetchNegativeKeywords, 'negative-keywords'));

// Phase 4 Routes
router.post('/shopping-products', apiRateLimiter, createReportHandler(fetchShoppingProducts, 'shopping-products'));
router.post('/product-groups', apiRateLimiter, createReportHandler(fetchProductGroups, 'product-groups'));
router.post('/asset-groups', apiRateLimiter, createReportHandler(fetchAssetGroups, 'asset-groups'));
router.post('/change-history', apiRateLimiter, createReportHandler(fetchChangeHistory, 'change-history'));

export default router;

