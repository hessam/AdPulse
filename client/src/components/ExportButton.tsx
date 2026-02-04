interface Props {
    cleanReport: string;
}

export function ExportButton({ cleanReport }: Props) {
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(cleanReport);
            alert('Report copied to clipboard!');
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = cleanReport;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('Report copied to clipboard!');
        }
    };

    const handleDownload = () => {
        const blob = new Blob([cleanReport], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `adpulse-audit-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="card">
            <div className="card__header">
                <div className="card__icon">📋</div>
                <h2 className="card__title">Clean Report (Markdown)</h2>
            </div>

            <div className="report">{cleanReport}</div>

            <div className="btn-group">
                <button className="btn btn--primary" onClick={handleCopy}>
                    📋 Copy to Clipboard
                </button>
                <button className="btn btn--secondary" onClick={handleDownload}>
                    💾 Download .md
                </button>
            </div>
        </div>
    );
}
