import type { Command } from './contracts';

class CommandRegistry {
  private commands: Map<string, Command> = new Map();
  private listeners: (() => void)[] = [];

  register(command: Command) {
    this.commands.set(command.id, command);
    this.notify();
  }

  unregister(id: string) {
    this.commands.delete(id);
    this.notify();
  }

  getAll(): Command[] {
    return Array.from(this.commands.values());
  }

  get(id: string): Command | undefined {
    return this.commands.get(id);
  }

  execute(id: string) {
    const command = this.commands.get(id);
    if (command) {
      command.action();
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }
}

export const commandRegistry = new CommandRegistry();
