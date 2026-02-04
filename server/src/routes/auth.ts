import { Router } from 'express';
import { z } from 'zod';
import { getAccessToken } from '../services/googleAdsService.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Validation schema
const tokenRequestSchema = z.object({
    refreshToken: z.string().min(1),
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
});

/**
 * POST /api/auth/token
 * Exchange refresh token for access token
 */
router.post('/token', authRateLimiter, async (req, res, next) => {
    try {
        const { refreshToken, clientId, clientSecret } = tokenRequestSchema.parse(req.body);

        const tokenResponse = await getAccessToken(refreshToken, clientId, clientSecret);

        res.json({
            success: true,
            data: tokenResponse,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
