import { useState } from 'react';
import type { Credentials } from '../types';

interface Props {
    onSubmit: (credentials: Credentials) => void;
    isLoading: boolean;
}

const defaultCredentials: Credentials = {
    refreshToken: '',
    clientId: '',
    clientSecret: '',
    developerToken: '',
    customerId: '',
    loginCustomerId: '',
    openaiApiKey: '',
    startDate: '',
    endDate: '',
};

export function CredentialsForm({ onSubmit, isLoading }: Props) {
    const [credentials, setCredentials] = useState<Credentials>(() => {
        const saved = localStorage.getItem('adpulse_credentials');
        return saved ? JSON.parse(saved) : defaultCredentials;
    });
    const [errors, setErrors] = useState<Partial<Record<keyof Credentials, string>>>({});

    const handleChange = (field: keyof Credentials, value: string) => {
        setCredentials((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const validate = () => {
        const newErrors: Partial<Record<keyof Credentials, string>> = {};
        if (!credentials.openaiApiKey) newErrors.openaiApiKey = 'Required';
        else if (!credentials.openaiApiKey.startsWith('sk-')) {
            newErrors.openaiApiKey = 'Invalid format (should start with sk-)';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            localStorage.setItem('adpulse_credentials', JSON.stringify(credentials));
            onSubmit(credentials);
        }
    };

    const isValid =
        credentials.refreshToken &&
        credentials.clientId &&
        credentials.clientSecret &&
        credentials.developerToken &&
        credentials.customerId &&
        credentials.openaiApiKey;

    return (
        <div className="card">
            <div className="card__header">
                <div className="card__icon">🔐</div>
                <h2 className="card__title">API Credentials</h2>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">OAuth2 Client ID</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="xxxxx.apps.googleusercontent.com"
                            value={credentials.clientId}
                            onChange={(e) => handleChange('clientId', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">OAuth2 Client Secret</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="GOCSPX-xxxxx"
                            value={credentials.clientSecret}
                            onChange={(e) => handleChange('clientSecret', e.target.value)}
                        />
                    </div>

                    <div className="form-group form-group--full">
                        <label className="form-label">Refresh Token</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="1//xxxxx"
                            value={credentials.refreshToken}
                            onChange={(e) => handleChange('refreshToken', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Developer Token</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="xxxxx"
                            value={credentials.developerToken}
                            onChange={(e) => handleChange('developerToken', e.target.value)}
                        />
                        <span className="form-hint">Must be approved by Google</span>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Customer ID</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="123-456-7890"
                            value={credentials.customerId}
                            onChange={(e) => handleChange('customerId', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Login Customer ID (MCC)</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Optional - for Manager Accounts"
                            value={credentials.loginCustomerId}
                            onChange={(e) => handleChange('loginCustomerId', e.target.value)}
                        />
                        <span className="form-hint">Only if using MCC to access sub-accounts</span>
                    </div>

                    <div className="form-group">
                        <label className="form-label">OpenAI API Key</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="sk-..."
                            value={credentials.openaiApiKey}
                            onChange={(e) => handleChange('openaiApiKey', e.target.value)}
                        />
                        {errors.openaiApiKey && (
                            <p className="mt-1 text-sm text-red-500">{errors.openaiApiKey}</p>
                        )}
                    </div>

                    <div className="form-group form-group--half">
                        <label className="form-label">Start Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={credentials.startDate || ''}
                            onChange={(e) => handleChange('startDate', e.target.value)}
                        />
                    </div>

                    <div className="form-group form-group--half">
                        <label className="form-label">End Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={credentials.endDate || ''}
                            onChange={(e) => handleChange('endDate', e.target.value)}
                        />
                    </div>
                </div>

                <div className="btn-group">
                    <button
                        type="submit"
                        className="btn btn--primary"
                        disabled={!isValid || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="spinner" />
                                Fetching Campaigns...
                            </>
                        ) : (
                            <>📊 Fetch Campaign Data</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
