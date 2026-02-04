import { Router } from 'express';
import { z } from 'zod';
import { getAccessToken, fetchCampaigns } from '../services/googleAdsService.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Validation schema for campaign fetch
const campaignRequestSchema = z.object({
    refreshToken: z.string().min(1),
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    developerToken: z.string().min(1),
    customerId: z.string().min(1),
    loginCustomerId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

/**
 * POST /api/google-ads/campaigns
 * Fetch campaign data with configs and performance metrics
 */
router.post('/campaigns', apiRateLimiter, async (req, res, next) => {
    try {
        console.log('=== CAMPAIGN API REQUEST ===');
        console.log('Body:', JSON.stringify(req.body, null, 2));
        console.log('============================');

        const {
            refreshToken,
            clientId,
            clientSecret,
            developerToken,
            customerId,
            loginCustomerId,
            startDate,
            endDate
        } = campaignRequestSchema.parse(req.body);

        // Exchange refresh token for access token
        const tokenResponse = await getAccessToken(refreshToken, clientId, clientSecret);

        // Fetch campaigns
        const campaigns = await fetchCampaigns(
            tokenResponse.accessToken,
            {
                refreshToken,
                clientId,
                clientSecret,
                developerToken,
                customerId,
                loginCustomerId,
            } as any,
            startDate && endDate ? { startDate, endDate } : undefined
        );
        res.json({
            success: true,
            data: {
                campaigns,
                fetchedAt: new Date().toISOString(),
                count: campaigns.length,
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
