import { Router } from 'express';
import { z } from 'zod';
import { generateAudit } from '../services/openaiService.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import type { CampaignData } from '../types/index.js';

const router = Router();

// Validation schema
const auditRequestSchema = z.object({
    campaigns: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
            status: z.enum(['ENABLED', 'PAUSED', 'REMOVED']),
            channelType: z.string(),
            biddingStrategyType: z.string(),
            dailyBudget: z.number(),
            impressions: z.number(),
            clicks: z.number(),
            cost: z.number(),
            conversions: z.number(),
            ctr: z.number(),
            avgCpc: z.number(),
        })
    ),
    openaiApiKey: z.string().min(1),
    dateRange: z.object({
        startDate: z.string(),
        endDate: z.string(),
    }).optional(),
});

/**
 * POST /api/audit/generate
 * Generate AI-powered audit from campaign data
 */
router.post('/generate', apiRateLimiter, async (req, res, next) => {
    try {
        const { campaigns, openaiApiKey, dateRange } = auditRequestSchema.parse(req.body);

        if (campaigns.length === 0) {
            res.status(400).json({
                success: false,
                error: 'NO_CAMPAIGNS',
                message: 'No campaigns provided for audit',
            });
            return;
        }

        const audit = await generateAudit(campaigns as CampaignData[], openaiApiKey, dateRange);

        res.json({
            success: true,
            data: {
                ...audit,
                generatedAt: new Date().toISOString(),
                campaignCount: campaigns.length,
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
