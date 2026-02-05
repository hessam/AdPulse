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

/**
 * POST /api/audit/comprehensive
 * Generate comprehensive AI audit from ALL report data
 */
router.post('/comprehensive', apiRateLimiter, async (req, res, next) => {
    try {
        const { allReports, openaiApiKey, dateRange } = req.body;
        console.log('[Audit] Comprehensive audit request received');

        if (!allReports || !openaiApiKey) {
            res.status(400).json({
                success: false,
                error: 'MISSING_DATA',
                message: 'allReports and openaiApiKey are required',
            });
            return;
        }

        console.log('[Audit] Building prompt with data counts:', {
            campaigns: allReports.campaigns?.length || 0,
            geographic: allReports.geographic?.length || 0,
            devices: allReports.devices?.length || 0,
            searchTerms: allReports.searchTerms?.length || 0,
            keywords: allReports.keywords?.length || 0,
        });

        // Build comprehensive prompt with all data
        const prompt = buildComprehensivePrompt(allReports, dateRange);
        console.log('[Audit] Prompt length:', prompt.length, 'characters');

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: 'You are a senior Google Ads strategist. Analyze all the data provided and create a comprehensive audit report with actionable recommendations.' },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.7,
                max_tokens: 4000,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Audit] OpenAI API error:', errorText.substring(0, 500));
            throw new Error(`OpenAI API error: ${errorText.substring(0, 200)}`);
        }

        const data = await response.json() as { choices?: { message?: { content?: string } }[] };
        const content = data.choices?.[0]?.message?.content || '';
        console.log('[Audit] Successfully generated audit, length:', content.length);

        res.json({
            success: true,
            data: {
                summary: content.substring(0, 500),
                recommendations: [],
                cleanReport: content,
                generatedAt: new Date().toISOString(),
                campaignCount: allReports.campaigns?.length || 0,
            },
        });
    } catch (error: any) {
        console.error('[Audit] Comprehensive audit error:', error?.message || error);
        next(error);
    }
});

function buildComprehensivePrompt(allReports: any, dateRange?: { startDate: string; endDate: string }) {
    const dateContext = dateRange
        ? `Analysis period: ${dateRange.startDate} to ${dateRange.endDate}\n\n`
        : 'Analysis period: Last 90 days\n\n';

    return `${dateContext}
## CAMPAIGNS (${allReports.campaigns?.length || 0})
${JSON.stringify(allReports.campaigns?.slice(0, 20) || [], null, 2)}

## GEOGRAPHIC PERFORMANCE (${allReports.geographic?.length || 0})
${JSON.stringify(allReports.geographic?.slice(0, 10) || [], null, 2)}

## DEVICE PERFORMANCE (${allReports.devices?.length || 0})
${JSON.stringify(allReports.devices?.slice(0, 10) || [], null, 2)}

## TOP SEARCH TERMS (${allReports.searchTerms?.length || 0})
${JSON.stringify(allReports.searchTerms?.slice(0, 15) || [], null, 2)}

## QUALITY SCORES (${allReports.qualityScores?.length || 0})
${JSON.stringify(allReports.qualityScores?.slice(0, 10) || [], null, 2)}

## AUCTION INSIGHTS (${allReports.auctionInsights?.length || 0})
${JSON.stringify(allReports.auctionInsights?.slice(0, 10) || [], null, 2)}

## CONVERSION ACTIONS (${allReports.conversionActions?.length || 0})
${JSON.stringify(allReports.conversionActions || [], null, 2)}

## LANDING PAGES (${allReports.landingPages?.length || 0})
${JSON.stringify(allReports.landingPages?.slice(0, 10) || [], null, 2)}

## SHOPPING PRODUCTS (${allReports.shoppingProducts?.length || 0})
${JSON.stringify(allReports.shoppingProducts?.slice(0, 10) || [], null, 2)}

## RECENT CHANGES (${allReports.changeHistory?.length || 0})
${JSON.stringify(allReports.changeHistory?.slice(0, 10) || [], null, 2)}

---

Please provide a comprehensive audit covering:
1. **Executive Summary** - Overall account health
2. **Campaign Analysis** - Strengths and weaknesses
3. **Geographic Insights** - Where to focus/reduce spend
4. **Device Performance** - Mobile vs Desktop optimization
5. **Search Term Analysis** - Keywords to add as negatives, opportunities
6. **Quality Score Issues** - Low QS keywords to fix
7. **Competitive Position** - Auction insights assessment
8. **Conversion Tracking** - Attribution recommendations
9. **Landing Page Performance** - Pages needing optimization
10. **Top 5 Priority Actions** - Most impactful next steps

Format as clean Markdown.`;
}

export default router;

