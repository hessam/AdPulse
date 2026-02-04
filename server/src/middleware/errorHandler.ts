import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import type { ApiError } from '../types/index.js';

export function errorHandler(
    err: Error,
    _req: Request,
    res: Response<ApiError>,
    _next: NextFunction
): void {
    // Log full error details for debugging
    console.error('------- API Error -------');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    if ('response' in err && typeof (err as any).response === 'object') {
        console.error('Response Data:', (err as any).response?.data);
    }
    console.error('-------------------------');

    // Zod validation errors
    if (err instanceof ZodError) {
        res.status(400).json({
            error: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: err.errors,
        });
        return;
    }

    // Google Ads API errors
    if (err.message.includes('PERMISSION_DENIED') || err.message.includes('403')) {
        res.status(403).json({
            error: 'GOOGLE_ADS_PERMISSION_DENIED',
            message: 'Access denied. Check your Developer Token status and account permissions.',
        });
        return;
    }

    if (err.message.includes('UNAUTHENTICATED') || err.message.includes('401')) {
        res.status(401).json({
            error: 'GOOGLE_ADS_UNAUTHENTICATED',
            message: 'Invalid or expired access token. Please refresh your credentials.',
        });
        return;
    }

    // OAuth Token Exchange errors
    if (err.message.includes('Token exchange failed')) {
        res.status(400).json({
            error: 'OAUTH_TOKEN_EXCHANGE_FAILED',
            message: err.message,
        });
        return;
    }

    // Gemini API errors
    if (err.message.includes('Gemini API error')) {
        res.status(400).json({
            error: 'GEMINI_API_ERROR',
            message: err.message,
        });
        return;
    }

    // Generic error
    res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
}
