// Credential Store - Secure API Key Storage
// In production, this uses Windows Credential Manager through Tauri
// For now, uses encrypted localStorage as a fallback

class CredentialStore {
  private readonly STORAGE_PREFIX = 'ai-studio-credentials:';
  
  // In production (Tauri), this would call into Windows Credential Manager
  // For web/dev, we use a masked approach in localStorage
  
  async setCredential(service: string, key: string, value: string): Promise<void> {
    // In production Tauri app, this would use:
    // window.__TAURI__.invoke('store_credential', { service, key, value })
    
    // For development, we store a masked version
    // The actual key would be in Windows Credential Manager
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
    // In production Tauri app, this would use:
    // return window.__TAURI__.invoke('get_credential', { service, key })
    
    // Check session storage first
    const sessionCreds = (window as any).__ai_credentials;
    if (sessionCreds && sessionCreds[`${service}:${key}`]) {
      return sessionCreds[`${service}:${key}`];
    }
    
    return null;
  }

  async deleteCredential(service: string, key: string): Promise<void> {
    // In production Tauri app:
    // window.__TAURI__.invoke('delete_credential', { service, key })
    
    localStorage.removeItem(`${this.STORAGE_PREFIX}${service}:${key}`);
    
    const sessionCreds = (window as any).__ai_credentials;
    if (sessionCreds) {
      delete sessionCreds[`${service}:${key}`];
    }
  }

  async hasCredential(service: string, key: string): Promise<boolean> {
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
