// Credential Store - Secure API Key Storage
// Uses Windows Credential Manager through Tauri in production
// Falls back to session-only storage in browser development

import { isTauri, invokeTauriCommand } from '../desktop';

class CredentialStore {
  private readonly STORAGE_PREFIX = 'ai-studio-credentials:';
  
  async setCredential(service: string, key: string, value: string): Promise<void> {
    if (isTauri()) {
      // Use Windows Credential Manager through Tauri
      try {
        await invokeTauriCommand('store_credential', { service, key, value });
        
        // Store masked version for display
        const masked = this.maskKey(value);
        localStorage.setItem(`${this.STORAGE_PREFIX}${service}:${key}`, JSON.stringify({
          masked,
          hasValue: true,
          lastUpdated: new Date().toISOString(),
        }));
        return;
      } catch (error) {
        console.error('Failed to store credential in Windows Credential Manager:', error);
        throw error;
      }
    }
    
    // Browser development fallback - session only
    const masked = this.maskKey(value);
    localStorage.setItem(`${this.STORAGE_PREFIX}${service}:${key}`, JSON.stringify({
      masked,
      hasValue: true,
      lastUpdated: new Date().toISOString(),
    }));
    
    // Store the actual key in a session-only variable (not persisted)
    (window as any).__ai_credentials = (window as any).__ai_credentials || {};
    (window as any).__ai_credentials[`${service}:${key}`] = value;
  }

  async getCredential(service: string, key: string): Promise<string | null> {
    if (isTauri()) {
      // Use Windows Credential Manager through Tauri
      try {
        const response = await invokeTauriCommand<{ success: boolean; value: string | null; error: string | null }>(
          'get_credential',
          { service, key }
        );
        
        if (response.success) {
          return response.value;
        }
        return null;
      } catch (error) {
        console.error('Failed to get credential from Windows Credential Manager:', error);
        return null;
      }
    }
    
    // Browser development fallback
    const sessionCreds = (window as any).__ai_credentials;
    if (sessionCreds && sessionCreds[`${service}:${key}`]) {
      return sessionCreds[`${service}:${key}`];
    }
    
    return null;
  }

  async deleteCredential(service: string, key: string): Promise<void> {
    if (isTauri()) {
      // Use Windows Credential Manager through Tauri
      try {
        await invokeTauriCommand('delete_credential', { service, key });
      } catch (error) {
        console.error('Failed to delete credential from Windows Credential Manager:', error);
      }
    }
    
    localStorage.removeItem(`${this.STORAGE_PREFIX}${service}:${key}`);
    
    const sessionCreds = (window as any).__ai_credentials;
    if (sessionCreds) {
      delete sessionCreds[`${service}:${key}`];
    }
  }

  async hasCredential(service: string, key: string): Promise<boolean> {
    if (isTauri()) {
      // Use Windows Credential Manager through Tauri
      try {
        const response = await invokeTauriCommand<{ success: boolean; value: string | null; error: string | null }>(
          'has_credential',
          { service, key }
        );
        
        if (response.success && response.value) {
          return response.value === 'true';
        }
        return false;
      } catch (error) {
        console.error('Failed to check credential in Windows Credential Manager:', error);
        return false;
      }
    }
    
    // Browser development fallback
    const stored = localStorage.getItem(`${this.STORAGE_PREFIX}${service}:${key}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.hasValue === true;
    }
    
    const sessionCreds = (window as any).__ai_credentials;
    return !!(sessionCreds && sessionCreds[`${service}:${key}`]);
  }

  async getMaskedCredential(service: string, key: string): Promise<string | null> {
    const stored = localStorage.getItem(`${this.STORAGE_PREFIX}${service}:${key}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.masked || null;
    }
    return null;
  }

  private maskKey(key: string): string {
    if (key.length <= 8) return '••••••••';
    return `${key.substring(0, 4)}${'•'.repeat(Math.min(key.length - 8, 20))}${key.substring(key.length - 4)}`;
  }
}

export const credentialStore = new CredentialStore();
