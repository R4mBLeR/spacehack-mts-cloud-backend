import WebSocket from 'ws';

export interface ConsoleSession {
  pveWs: WebSocket;
  vmId: number;
  node: string;
  type: 'qemu' | 'lxc';
  connectedAt: Date;
  lastActivity: Date;
}

export interface ConsoleStats {
  activeSessions: number;
  totalSessions: number;
  sessionsByVm: Map<number, number>;
}

export interface ConsoleTicketResponse {
  ticket: string;
  port: number;
  user: string;
  upid?: string;
}
