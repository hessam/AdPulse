import type { AuditResult } from '../types';

interface Props {
    audit: AuditResult;
}

export function AuditResults({ audit }: Props) {
    return (
        <div className="card">
            <div className="card__header">
                <div className="card__icon">🤖</div>
                <h2 className="card__title">AI Audit Results</h2>
            </div>

            {/* Executive Summary */}
            <div className="summary">
                <p className="summary__text">{audit.summary}</p>
            </div>

            {/* Recommendations */}
            <h3 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: 600 }}>
                Recommendations ({audit.recommendations.length})
            </h3>

            <div className="recommendations">
                {audit.recommendations.map((rec, index) => (
                    <div
                        key={index}
                        className={`recommendation recommendation--${rec.priority.toLowerCase()}`}
                    >
                        <div className="recommendation__header">
                            <span className={`priority priority--${rec.priority.toLowerCase()}`}>
                                {rec.priority === 'HIGH' && '🔴'}
                                {rec.priority === 'MEDIUM' && '🟡'}
                                {rec.priority === 'LOW' && '🟢'}
                                {rec.priority}
                            </span>
                            <span className="recommendation__category">{rec.category}</span>
                        </div>
                        <p className="recommendation__issue">{rec.issue}</p>
                        <p className="recommendation__action">{rec.action}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
