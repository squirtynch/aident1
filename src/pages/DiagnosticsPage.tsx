import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Badge, Spinner } from '../components/ui';
import { diagnosticsService, type DiagnosticReport } from '../lib/diagnostics';

export const DiagnosticsPage: React.FC = () => {
  const { t } = useTranslation();
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<DiagnosticReport | null>(null);

  const handleRunDiagnostics = async () => {
    setRunning(true);
    setReport(null);

    try {
      const result = await diagnosticsService.runFullDiagnostic();
      setReport(result);
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setRunning(false);
    }
  };

  const handleCopyReport = () => {
    if (report) {
      const text = diagnosticsService.exportReport(report);
      navigator.clipboard.writeText(text);
    }
  };

  const getStatusColor = (status: 'pass' | 'warn' | 'fail') => {
    return status === 'pass' ? 'success' : status === 'warn' ? 'warning' : 'danger';
  };

  const getStatusIcon = (status: 'pass' | 'warn' | 'fail') => {
    return status === 'pass' ? '✓' : status === 'warn' ? '⚠' : '✗';
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('settings.systemDiagnostics')}</h2>
            <p className="text-sm text-[var(--text-secondary)]">{t('settings.checkSystemHealth')}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRunDiagnostics} disabled={running}>
              {running ? <Spinner size="sm" /> : t('settings.runDiagnostics')}
            </Button>
            {report && (
              <Button variant="secondary" onClick={handleCopyReport}>
                {t('settings.copyReport')}
              </Button>
            )}
          </div>
        </div>

        {running && (
          <Card className="p-8">
            <div className="text-center">
              <Spinner size="lg" className="mx-auto mb-4" />
              <p className="text-[var(--text-secondary)]">{t('settings.runningDiagnostics')}</p>
            </div>
          </Card>
        )}

        {report && !running && (
          <div className="space-y-4">
            {/* Summary */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('settings.summary')}</h3>
                <div className="flex gap-2">
                  <Badge variant="success">{report.summary.passed} {t('settings.passed')}</Badge>
                  <Badge variant="warning">{report.summary.warnings} {t('settings.warnings')}</Badge>
                  <Badge variant="danger">{report.summary.errors} {t('settings.errors')}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[var(--text-secondary)]">{t('settings.version')}:</span>{' '}
                  <span className="text-[var(--text-primary)] font-mono">{report.version}</span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">{t('settings.platform')}:</span>{' '}
                  <span className="text-[var(--text-primary)]">{report.platform}</span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">{t('settings.timestamp')}:</span>{' '}
                  <span className="text-[var(--text-primary)] font-mono text-xs">
                    {new Date(report.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>

            {/* Checks */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{t('settings.detailedResults')}</h3>
              <div className="space-y-3">
                {report.checks.map((check, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)]"
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold
                        ${check.status === 'pass' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                        ${check.status === 'warn' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                        ${check.status === 'fail' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                      `}
                    >
                      {getStatusIcon(check.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-[var(--text-primary)]">{check.name}</h4>
                        <Badge variant={getStatusColor(check.status)}>{check.status}</Badge>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)]">{check.message}</p>
                      {check.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-[var(--text-tertiary)] cursor-pointer hover:text-[var(--text-secondary)]">
                            {t('settings.details')}
                          </summary>
                          <pre className="mt-2 text-xs bg-[var(--bg-hover)] p-2 rounded overflow-x-auto">
                            {JSON.stringify(check.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Overall Status */}
            <Card className={`p-4 ${report.summary.errors > 0 ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : report.summary.warnings > 0 ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-green-500 bg-green-50 dark:bg-green-900/20'}`}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {report.summary.errors > 0 ? '❌' : report.summary.warnings > 0 ? '⚠️' : '✅'}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    {report.summary.errors > 0
                      ? t('settings.systemHasErrors')
                      : report.summary.warnings > 0
                      ? t('settings.systemHasWarnings')
                      : t('settings.systemIsHealthy')}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {report.summary.errors > 0
                      ? t('settings.addressErrors')
                      : report.summary.warnings > 0
                      ? t('settings.reviewWarnings')
                      : t('settings.allChecksPassed')}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {!report && !running && (
          <Card className="p-8">
            <div className="text-center">
              <svg
                className="w-16 h-16 text-[var(--text-tertiary)] mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-[var(--text-secondary)]">
                {t('settings.clickToCheck')}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
