// Desktop runtime abstraction
// Provides safe fallbacks for browser development and Tauri APIs for desktop

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

export function isDesktop(): boolean {
  return isTauri();
}

export async function invokeTauriCommand<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri()) {
    throw new Error(`Cannot invoke Tauri command "${command}" in browser mode`);
  }

  const tauri = (window as any).__TAURI__;
  return tauri.invoke(command, args);
}

export async function getDesktopPath(): Promise<string> {
  if (isTauri()) {
    try {
      const tauri = (window as any).__TAURI__;
      return await tauri.path.documentDir();
    } catch {
      return 'Documents/AI Product Studio';
    }
  }
  return 'Documents/AI Product Studio';
}

export async function showNotification(title: string, body: string): Promise<void> {
  if (isTauri()) {
    try {
      const tauri = (window as any).__TAURI__;
      await tauri.notification.sendNotification({ title, body });
    } catch {
      console.log(`[Notification] ${title}: ${body}`);
    }
  } else {
    console.log(`[Notification] ${title}: ${body}`);
  }
}

export async function getClipboardText(): Promise<string | null> {
  if (isTauri()) {
    try {
      const tauri = (window as any).__TAURI__;
      return await tauri.clipboard.readText();
    } catch {
      return null;
    }
  }
  
  // Browser fallback
  try {
    return await navigator.clipboard.readText();
  } catch {
    return null;
  }
}

export async function setClipboardText(text: string): Promise<boolean> {
  if (isTauri()) {
    try {
      const tauri = (window as any).__TAURI__;
      await tauri.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
  
  // Browser fallback
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
