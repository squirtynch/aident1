// Test Runner Page - Accessible from the app for development

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner } from '../components/ui';
import { runTests } from '../tests/ai-engine.test';
import { runCreativeTests } from '../tests/creative-studio.test';

export const TestRunnerPage: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<{ passed: number; failed: number; errors: string[] } | null>(null);
  const [testSuite, setTestSuite] = useState<'ai-engine' | 'creative-studio' | 'all'>('all');

  const handleRunTests = async () => {
    setRunning(true);
    setResults(null);
    
    try {
      let testResults = { passed: 0, failed: 0, errors: [] as string[] };
      
      if (testSuite === 'ai-engine' || testSuite === 'all') {
        const aiResults = await runTests();
        testResults.passed += aiResults.passed;
        testResults.failed += aiResults.failed;
        testResults.errors.push(...aiResults.errors);
      }
      
      if (testSuite === 'creative-studio' || testSuite === 'all') {
        const creativeResults = await runCreativeTests();
        testResults.passed += creativeResults.passed;
        testResults.failed += creativeResults.failed;
        testResults.errors.push(...creativeResults.errors);
      }
      
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
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Test Suite</h2>
            <p className="text-sm text-[var(--text-secondary)]">Run tests for AI Product Studio components.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={testSuite}
              onChange={e => setTestSuite(e.target.value as any)}
              className="px-3 py-2 text-sm rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none"
            >
              <option value="all">All Tests</option>
              <option value="ai-engine">AI Engine</option>
              <option value="creative-studio">Creative Studio</option>
            </select>
            <Button onClick={handleRunTests} disabled={running}>
              {running ? <Spinner size="sm" /> : 'Run Tests'}
            </Button>
          </div>
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
