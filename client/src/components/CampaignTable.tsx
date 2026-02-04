import type { CampaignData } from '../types';

interface Props {
    campaigns: CampaignData[];
}

export function CampaignTable({ campaigns }: Props) {
    const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
    const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;
    const formatNumber = (value: number) => value.toLocaleString();

    return (
        <div className="card">
            <div className="card__header">
                <div className="card__icon">📈</div>
                <h2 className="card__title">Campaign Data ({campaigns.length} campaigns)</h2>
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Campaign</th>
                            <th>Status</th>
                            <th>Type</th>
                            <th>Budget/Day</th>
                            <th>Impressions</th>
                            <th>Clicks</th>
                            <th>CTR</th>
                            <th>Cost</th>
                            <th>Conversions</th>
                            <th>Avg CPC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {campaigns.map((campaign) => (
                            <tr key={campaign.id}>
                                <td>
                                    <strong>{campaign.name}</strong>
                                </td>
                                <td>
                                    <span className={`badge badge--${campaign.status.toLowerCase()}`}>
                                        {campaign.status}
                                    </span>
                                </td>
                                <td>{campaign.channelType.replace('_', ' ')}</td>
                                <td>{formatCurrency(campaign.dailyBudget)}</td>
                                <td>{formatNumber(campaign.impressions)}</td>
                                <td>{formatNumber(campaign.clicks)}</td>
                                <td>{formatPercent(campaign.ctr)}</td>
                                <td>{formatCurrency(campaign.cost)}</td>
                                <td>{formatNumber(campaign.conversions)}</td>
                                <td>{formatCurrency(campaign.avgCpc)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
