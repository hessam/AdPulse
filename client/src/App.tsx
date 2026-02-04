import { useState } from 'react';
import { CredentialsForm } from './components/CredentialsForm';
import { CampaignTable } from './components/CampaignTable';
import { AuditResults } from './components/AuditResults';
import { ExportButton } from './components/ExportButton';
import { fetchCampaigns, generateAudit } from './services/api';
import type { Credentials, CampaignData, AuditResult } from './types';

type Step = 'credentials' | 'campaigns' | 'audit';

export default function App() {
    const [step, setStep] = useState<Step>('credentials');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [credentials, setCredentials] = useState<Credentials | null>(null);
    const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
    const [audit, setAudit] = useState<AuditResult | null>(null);

    const handleCredentialsSubmit = async (creds: Credentials) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetchCampaigns(creds);
            setCredentials(creds);
            setCampaigns(response.campaigns);
            setStep('campaigns');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch campaigns');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateAudit = async () => {
        if (!credentials || campaigns.length === 0) return;

        setIsLoading(true);
        setError(null);

        try {
            const auditResult = await generateAudit(
                campaigns,
                credentials.openaiApiKey,
                credentials.startDate && credentials.endDate
                    ? { startDate: credentials.startDate, endDate: credentials.endDate }
                    : undefined
            );
            setAudit(auditResult);
            setStep('audit');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate audit');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setStep('credentials');
        setCredentials(null);
        setCampaigns([]);
        setAudit(null);
        setError(null);
    };

    return (
        <div className="app">
            {/* Header */}
            <header className="header">
                <div className="header__logo">
                    <div className="header__icon">⚡</div>
                    <h1 className="header__title">AdPulse AI</h1>
                </div>
                <p className="header__subtitle">
                    AI-Powered Google Ads Auditor & Optimization Engine
                </p>
            </header>

            {/* Steps */}
            <div className="steps">
                <div className={`step ${step === 'credentials' ? 'step--active' : ''} ${step !== 'credentials' ? 'step--completed' : ''}`}>
                    <span className="step__number">{step === 'credentials' ? '1' : '✓'}</span>
                    <span className="step__label">Connect API</span>
                </div>
                <div className={`step ${step === 'campaigns' ? 'step--active' : ''} ${step === 'audit' ? 'step--completed' : ''}`}>
                    <span className="step__number">{step === 'audit' ? '✓' : '2'}</span>
                    <span className="step__label">Review Data</span>
                </div>
                <div className={`step ${step === 'audit' ? 'step--active' : ''}`}>
                    <span className="step__number">3</span>
                    <span className="step__label">AI Audit</span>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="error">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Step 1: Credentials */}
            {step === 'credentials' && (
                <CredentialsForm onSubmit={handleCredentialsSubmit} isLoading={isLoading} />
            )}

            {/* Step 2: Campaigns */}
            {step === 'campaigns' && (
                <>
                    <CampaignTable campaigns={campaigns} />
                    <div className="btn-group">
                        <button className="btn btn--secondary" onClick={handleReset}>
                            ← Back
                        </button>
                        <button
                            className="btn btn--primary"
                            onClick={handleGenerateAudit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner" />
                                    Generating Audit...
                                </>
                            ) : (
                                <>🤖 Generate AI Audit</>
                            )}
                        </button>
                    </div>
                </>
            )}

            {/* Step 3: Audit */}
            {step === 'audit' && audit && (
                <>
                    <AuditResults audit={audit} />
                    <ExportButton cleanReport={audit.cleanReport} />
                    <div className="btn-group">
                        <button className="btn btn--secondary" onClick={handleReset}>
                            ← Start Over
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
