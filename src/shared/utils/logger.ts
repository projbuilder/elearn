// Centralized Logging Utility
// Provides consistent logging across the application

import { FEATURES } from '@/config/features.config';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private shouldLog(): boolean {
    return FEATURES.CONSOLE_LOGGING || FEATURES.DEBUG_MODE;
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.shouldLog()) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'error':
        console.error(prefix, message, ...args);
        break;
      case 'warn':
        console.warn(prefix, message, ...args);
        break;
      case 'debug':
        console.debug(prefix, message, ...args);
        break;
      default:
        console.log(prefix, message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    this.formatMessage('info', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.formatMessage('warn', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.formatMessage('error', message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.formatMessage('debug', message, ...args);
  }
}

export const logger = new Logger();
