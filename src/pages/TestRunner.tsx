// Test Runner Page - Accessible from the app for development

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner } from '../components/ui';
import { runTests } from '../tests/ai-engine.test';

export const TestRunnerPage: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<{ passed: number; failed: number; errors: string[] } | null>(null);

  const handleRunTests = async () => {
    setRunning(true);
    setResults(null);
    
    try {
      const testResults = await runTests();
      setResults(testResults);
    } catch (error) {
      setResults({
        passed: 0,
        failed: 1,
        errors: [error instanceof Error ? error.message : 'Test runner failed'],
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">AI Engine Tests</h2>
            <p className="text-sm text-[var(--text-secondary)]">Run the test suite for the AI engine components.</p>
          </div>
          <Button onClick={handleRunTests} disabled={running}>
            {running ? <Spinner size="sm" /> : 'Run Tests'}
          </Button>
        </div>

        {results && (
          <div className="space-y-4">
            {/* Summary */}
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="success">{results.passed} passed</Badge>
                  <Badge variant={results.failed > 0 ? 'danger' : 'default'}>{results.failed} failed</Badge>
                </div>
                <div className="text-sm text-[var(--text-secondary)]">
                  Total: {results.passed + results.failed} tests
                </div>
              </div>
            </Card>

            {/* Errors */}
            {results.errors.length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-red-600 mb-3">Failed Tests</h3>
                <div className="space-y-2">
                  {results.errors.map((error, i) => (
                    <div key={i} className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Success message */}
            {results.failed === 0 && (
              <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-400 font-medium">
                  ✓ All tests passed!
                </p>
              </Card>
            )}
          </div>
        )}

        {!results && !running && (
          <Card className="p-8">
            <div className="text-center">
              <svg className="w-16 h-16 text-[var(--text-tertiary)] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[var(--text-secondary)]">Click "Run Tests" to execute the AI engine test suite.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
