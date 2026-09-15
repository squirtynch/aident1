// System Diagnostics

import { logger } from './logger';
import { providerRegistry } from './ai/provider-registry';
import { capabilityService } from './ai/capability-service';

export interface DiagnosticReport {
  timestamp: string;
  version: string;
  platform: string;
  checks: DiagnosticCheck[];
  summary: {
    total: number;
    passed: number;
    warnings: number;
    errors: number;
  };
}

export interface DiagnosticCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: Record<string, any>;
}

class DiagnosticsService {
  async runFullDiagnostic(): Promise<DiagnosticReport> {
    const checks: DiagnosticCheck[] = [];

    // Application checks
    checks.push(await this.checkApplicationVersion());
    checks.push(await this.checkStorageHealth());
    checks.push(await this.checkDatabaseHealth());
    checks.push(await this.checkDiskSpace());

    // Provider checks
    checks.push(await this.checkProviderConnection());
    checks.push(await this.checkModelAvailability());

    // Capability checks
    checks.push(await this.checkCapabilities());

    // Network check
    checks.push(await this.checkNetwork());

    const summary = {
      total: checks.length,
      passed: checks.filter(c => c.status === 'pass').length,
      warnings: checks.filter(c => c.status === 'warn').length,
      errors: checks.filter(c => c.status === 'fail').length,
    };

    return {
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      platform: this.getPlatform(),
      checks,
      summary,
    };
  }

  private async checkApplicationVersion(): Promise<DiagnosticCheck> {
    return {
      name: 'Application Version',
      status: 'pass',
      message: 'Version 0.1.0',
      details: { version: '0.1.0', build: 'development' },
    };
  }

  private async checkStorageHealth(): Promise<DiagnosticCheck> {
    try {
      // Test localStorage
      const testKey = '__diagnostic_test__';
      localStorage.setItem(testKey, 'test');
      const value = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (value === 'test') {
        return {
          name: 'Storage Health',
          status: 'pass',
          message: 'LocalStorage is accessible',
          details: { available: true },
        };
      } else {
        return {
          name: 'Storage Health',
          status: 'fail',
          message: 'LocalStorage read/write failed',
        };
      }
    } catch (error) {
      return {
        name: 'Storage Health',
        status: 'fail',
        message: 'LocalStorage is not available',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  private async checkDatabaseHealth(): Promise<DiagnosticCheck> {
    // In production, this would check SQLite/Python Core
    // For web version, we use localStorage as database
    try {
      const projects = localStorage.getItem('ai-studio-projects');
      const projectCount = projects ? JSON.parse(projects).length : 0;

      return {
        name: 'Database Health',
        status: 'pass',
        message: `Database accessible (${projectCount} projects)`,
        details: { projectCount },
      };
    } catch (error) {
      return {
        name: 'Database Health',
        status: 'fail',
        message: 'Database access failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  private async checkDiskSpace(): Promise<DiagnosticCheck> {
    // In web environment, we can't check actual disk space
    // Estimate based on localStorage usage
    try {
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage.getItem(key)?.length || 0;
        }
      }

      const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
      const status = totalSize > 4 * 1024 * 1024 ? 'warn' : 'pass'; // Warn if > 4MB

      return {
        name: 'Storage Usage',
        status,
        message: `Using ${sizeMB} MB of localStorage`,
        details: { sizeMB: parseFloat(sizeMB) },
      };
    } catch (error) {
      return {
        name: 'Storage Usage',
        status: 'warn',
        message: 'Could not determine storage usage',
      };
    }
  }

  private async checkProviderConnection(): Promise<DiagnosticCheck> {
    try {
      const provider = providerRegistry.getActive();
      const response = await provider.validateApiKey();

      if (response.success) {
        return {
          name: 'Provider Connection',
          status: 'pass',
          message: `Connected to ${provider.name}`,
          details: { provider: provider.id },
        };
      } else {
        return {
          name: 'Provider Connection',
          status: 'fail',
          message: `Failed to connect to ${provider.name}`,
          details: { error: response.error?.message },
        };
      }
    } catch (error) {
      return {
        name: 'Provider Connection',
        status: 'fail',
        message: 'Provider connection check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  private async checkModelAvailability(): Promise<DiagnosticCheck> {
    try {
      const provider = providerRegistry.getActive();
      const response = await provider.listModels();

      if (response.success && response.data) {
        const modelCount = response.data.length;
        return {
          name: 'Model Availability',
          status: modelCount > 0 ? 'pass' : 'warn',
          message: `${modelCount} models available`,
          details: { modelCount },
        };
      } else {
        return {
          name: 'Model Availability',
          status: 'fail',
          message: 'Failed to load models',
          details: { error: response.error?.message },
        };
      }
    } catch (error) {
      return {
        name: 'Model Availability',
        status: 'fail',
        message: 'Model availability check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  private async checkCapabilities(): Promise<DiagnosticCheck> {
    try {
      const provider = providerRegistry.getActive();
      const modelsResponse = await provider.listModels();

      if (!modelsResponse.success || !modelsResponse.data || modelsResponse.data.length === 0) {
        return {
          name: 'AI Capabilities',
          status: 'warn',
          message: 'No models available to check capabilities',
        };
      }

      const firstModel = modelsResponse.data[0];
      const capabilities = await capabilityService.getCapabilities(firstModel.id);

      const supported = Object.entries(capabilities)
        .filter(([_, status]) => status === 'SUPPORTED')
        .map(([cap]) => cap);

      return {
        name: 'AI Capabilities',
        status: supported.length > 0 ? 'pass' : 'warn',
        message: `${supported.length} capabilities supported`,
        details: { capabilities, model: firstModel.id },
      };
    } catch (error) {
      return {
        name: 'AI Capabilities',
        status: 'fail',
        message: 'Capability check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  private async checkNetwork(): Promise<DiagnosticCheck> {
    try {
      // Simple network check - try to reach a known endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          name: 'Network Connectivity',
          status: 'pass',
          message: 'Network is accessible',
        };
      } else {
        return {
          name: 'Network Connectivity',
          status: 'warn',
          message: 'Network check returned non-OK status',
        };
      }
    } catch (error) {
      return {
        name: 'Network Connectivity',
        status: 'fail',
        message: 'Network is not accessible',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  private getPlatform(): string {
    if (typeof window !== 'undefined') {
      return `Web (${navigator.platform})`;
    }
    return 'Unknown';
  }

  exportReport(report: DiagnosticReport): string {
    const lines = [
      'AI Product Studio - Diagnostic Report',
      '=====================================',
      '',
      `Timestamp: ${report.timestamp}`,
      `Version: ${report.version}`,
      `Platform: ${report.platform}`,
      '',
      'Summary:',
      `  Total Checks: ${report.summary.total}`,
      `  Passed: ${report.summary.passed}`,
      `  Warnings: ${report.summary.warnings}`,
      `  Errors: ${report.summary.errors}`,
      '',
      'Detailed Results:',
      '-----------------',
    ];

    report.checks.forEach(check => {
      const statusIcon = check.status === 'pass' ? '✓' : check.status === 'warn' ? '⚠' : '✗';
      lines.push(`${statusIcon} ${check.name}: ${check.message}`);
      if (check.details) {
        lines.push(`  Details: ${JSON.stringify(check.details, null, 2)}`);
      }
    });

    return lines.join('\n');
  }
}

export const diagnosticsService = new DiagnosticsService();
