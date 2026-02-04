import type { CampaignData, AuditResponse } from '../types/index.js';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Generate AI audit using OpenAI GPT-4o
 */
export async function generateAudit(
    campaigns: CampaignData[],
    apiKey: string,
    dateRange?: { startDate: string; endDate: string }
): Promise<AuditResponse> {
    const prompt = buildAuditPrompt(campaigns, dateRange);

    const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            // ...
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert Google Ads auditor. You answer strictly in JSON.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        }),
    });
    // ... (unchanged response handling)

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || JSON.stringify(error)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error('No response from OpenAI');
    }

    try {
        return JSON.parse(content) as AuditResponse;
    } catch (e) {
        throw new Error('Failed to parse OpenAI JSON response');
    }
}

/**
 * Build the audit prompt for OpenAI
 */
function buildAuditPrompt(campaigns: CampaignData[], dateRange?: { startDate: string; endDate: string }): string {
    const campaignSummary = campaigns.map((c) => ({
        name: c.name,
        // ...
        status: c.status,
        type: c.channelType,
        bidding: c.biddingStrategyType,
        budget: `$${c.dailyBudget.toFixed(2)}/day`,
        spend: `$${c.cost.toFixed(2)}`,
        impressions: c.impressions,
        clicks: c.clicks,
        ctr: `${(c.ctr * 100).toFixed(2)}%`,
        conversions: c.conversions,
        cpc: `$${c.avgCpc.toFixed(2)}`,
    }));

    const dateContext = dateRange
        ? `from ${dateRange.startDate} to ${dateRange.endDate}`
        : 'from the last 30 days';

    return `Analyze the following campaign data ${dateContext} and provide optimization recommendations.

## Campaign Data
${JSON.stringify(campaignSummary, null, 2)}

## Output Format
You IS strictly required to output valid JSON matching this schema:
// ...
{
  "summary": "Executive summary string...",
  "recommendations": [
    {
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "category": "string",
      "issue": "string",
      "action": "string"
    }
  ],
  "cleanReport": "Markdown string..."
}

## Your Task
1. Provide an executive summary (2-3 sentences) of overall account health.
2. Identify performance bottlenecks and issues.
3. Generate actionable, prioritized recommendations.
4. Create a clean Markdown report in the 'cleanReport' field.

Focus on:
- Low-performing campaigns (high spend, low conversions)
- CTR optimization opportunities
- Budget allocation improvements
- Bidding strategy recommendations
- Channel type effectiveness
`;
}
