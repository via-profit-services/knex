declare module 'playground' {
  import { EventEmitter } from 'node:events';

  type ServerStartedCallback = (params: {port: number}) => void;

  interface ServerManager {
    on(event: 'start-server', listener: () => void): this;
    once(event: 'start-server', listener: () => void): this;
    addListener(event: 'start-server', listener: () => void): this;
    removeListener(event: 'start-server', listener: () => void): this;
    prependListener(event: 'start-server', listener: () => void): this;
    prependOnceListener(event: 'start-server', listener: () => void): this;
    emit(event: 'start-server', ...args: []): boolean;
    removeAllListeners(event: 'start-server'): this;
    listeners(event: 'start-server'): ReturnType<EventEmitter['listeners']>;
    listenerCount(event: 'start-server'): number;

    on(event: 'server-started', listener: ServerStartedCallback): this;
    once(event: 'server-started', listener: ServerStartedCallback): this;
    addListener(event: 'server-started', listener: ServerStartedCallback): this;
    removeListener(event: 'server-started', listener: ServerStartedCallback): this;
    prependListener(event: 'server-started', listener: ServerStartedCallback): this;
    prependOnceListener(event: 'server-started', listener: ServerStartedCallback): this;
    emit(event: 'server-started', ...args: Parameters<ServerStartedCallback>): boolean;
    removeAllListeners(event: 'server-started'): this;
    listeners(event: 'server-started'): ReturnType<EventEmitter['listeners']>;
    listenerCount(event: 'server-started'): number;

    on(event: 'stop-server', listener: () => void): this;
    once(event: 'stop-server', listener: () => void): this;
    addListener(event: 'stop-server', listener: () => void): this;
    removeListener(event: 'stop-server', listener: () => void): this;
    prependListener(event: 'stop-server', listener: () => void): this;
    prependOnceListener(event: 'stop-server', listener: () => void): this;
    emit(event: 'stop-server', ...args: []): boolean;
    removeAllListeners(event: 'stop-server'): this;
    listeners(event: 'stop-server'): ReturnType<EventEmitter['listeners']>;
    listenerCount(event: 'stop-server'): number;

    on(event: 'server-stopped', listener: () => void): this;
    once(event: 'server-stopped', listener: () => void): this;
    addListener(event: 'server-stopped', listener: () => void): this;
    removeListener(event: 'server-stopped', listener: () => void): this;
    prependListener(event: 'server-stopped', listener: () => void): this;
    prependOnceListener(event: 'server-stopped', listener: () => void): this;
    emit(event: 'server-stopped', ...args: []): boolean;
    removeAllListeners(event: 'server-stopped'): this;
    listeners(event: 'server-stopped'): ReturnType<EventEmitter['listeners']>;
    listenerCount(event: 'server-stopped'): number;
  }
}
