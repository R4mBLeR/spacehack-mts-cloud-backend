// src/console/console.service.ts
import { Injectable, Logger } from '@nestjs/common';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { ProxmoxService } from '../api/proxmox.service';
import { VmConsoleRepository } from '../repositories/vm.console.repository';
import { ConsoleSessionRepository } from '../repositories/console.session.repository';
import { ConnectConsoleDto, ConsoleType } from '../dto/connect.console.dto';
import { ConsoleSessionStatus } from '../models/console.entity';

// HTTP сессия с буфером вывода
interface HttpConsoleSession {
  dbSessionId: string;
  pveWs: WebSocket;
  outputBuffer: string[];
  eventEmitter: EventEmitter;
  lastActivity: Date;
}

// WebSocket сессия
interface WebSocketConsoleSession {
  dbSessionId: string;
  pveWs: WebSocket;
  lastActivity: Date;
}

@Injectable()
export class ConsoleService {
  private readonly logger = new Logger(ConsoleService.name);
  private httpSessions = new Map<string, HttpConsoleSession>(); // sessionId -> session
  private wsSessions = new Map<string, WebSocketConsoleSession>(); // clientId -> session
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000;

  constructor(
    private readonly proxmox: ProxmoxService,
    private readonly vmRepository: VmConsoleRepository,
    private readonly sessionRepository: ConsoleSessionRepository,
  ) {
    setInterval(() => this.cleanupInactiveSessions(), 5 * 60 * 1000);
  }

  // ============ WebSocket методы (для Gateway) ============

  async createSession(
    clientId: string,
    dto: ConnectConsoleDto,
  ): Promise<{ success: boolean; sessionId?: string; message?: string }> {
    const { vmId, type = ConsoleType.QEMU, node = 'pve' } = dto;

    try {
      const vm = await this.vmRepository.findVmById(vmId);
      if (!vm) {
        return { success: false, message: 'VM_NOT_FOUND' };
      }

      // Закрываем старую сессию этого клиента
      await this.closeSession(clientId);

      // Создаём запись в БД
      const dbSession = await this.sessionRepository.create({
        clientId,
        vmId,
        type,
        node,
        proxmoxVmid: vm.proxmox_id,
        status: ConsoleSessionStatus.CONNECTING,
      });

      // Получаем ticket от Proxmox
      const ticketData =
        type === ConsoleType.LXC
          ? await this.proxmox.getLxcTermTicket(node, vm.proxmox_id)
          : await this.proxmox.getVmTermTicket(node, vm.proxmox_id);

      await this.sessionRepository.repo.update(dbSession.id, {
        ticket: ticketData.ticket,
        port: ticketData.port,
      });

      // Подключаемся к Proxmox WebSocket
      const wsUrl = this.proxmox.buildVncWebSocketUrl(
        node,
        vm.proxmox_id,
        ticketData.port,
        ticketData.ticket,
        type,
      );

      const pveWs = new WebSocket(wsUrl, {
        rejectUnauthorized: false,
        headers: {
          Cookie: `PVEAuthCookie=${encodeURIComponent(ticketData.ticket)}`,
        },
      });

      // Ждём подключения
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          pveWs.terminate();
          reject(new Error('WebSocket connection timeout'));
        }, 10000);

        pveWs.on('open', () => {
          clearTimeout(timeout);
          this.logger.log(
            `Proxmox WS connected: session=${dbSession.id}, client=${clientId}`,
          );
          resolve();
        });

        pveWs.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      // Создаём WebSocket сессию
      const session: WebSocketConsoleSession = {
        dbSessionId: dbSession.id,
        pveWs,
        lastActivity: new Date(),
      };

      this.wsSessions.set(clientId, session);
      await this.sessionRepository.updateStatus(
        dbSession.id,
        ConsoleSessionStatus.ACTIVE,
      );

      return { success: true, sessionId: dbSession.id };
    } catch (error: any) {
      this.logger.error(`Failed to create session: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  async sendInput(clientId: string, data: string): Promise<boolean> {
    const session = this.wsSessions.get(clientId);
    if (!session || session.pveWs.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      session.pveWs.send(data);
      session.lastActivity = new Date();
      return true;
    } catch {
      return false;
    }
  }

  async resizeTerminal(
    clientId: string,
    cols: number,
    rows: number,
  ): Promise<boolean> {
    const session = this.wsSessions.get(clientId);
    if (!session || session.pveWs.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const resizeCmd = JSON.stringify({ type: 'resize', cols, rows });
      session.pveWs.send(resizeCmd);
      return true;
    } catch {
      return false;
    }
  }

  async getSessionInfo(clientId: string): Promise<any> {
    const session = this.wsSessions.get(clientId);
    if (!session) {
      const dbSession = await this.sessionRepository.findByClientId(clientId);
      if (!dbSession) return null;

      return {
        id: dbSession.id,
        vmId: dbSession.vmId,
        type: dbSession.type,
        node: dbSession.node,
        status: dbSession.status,
        createdAt: dbSession.createdAt,
        disconnectedAt: dbSession.disconnectedAt,
        active: false,
      };
    }

    const dbSession = await this.sessionRepository.findById(
      session.dbSessionId,
    );
    if (!dbSession) return null;

    return {
      id: dbSession.id,
      vmId: dbSession.vmId,
      type: dbSession.type,
      node: dbSession.node,
      status: dbSession.status,
      createdAt: dbSession.createdAt,
      lastActivity: session.lastActivity,
      uptime: Date.now() - dbSession.createdAt.getTime(),
      active: true,
    };
  }

  isSessionActive(clientId: string): boolean {
    const session = this.wsSessions.get(clientId);
    return !!session && session.pveWs.readyState === WebSocket.OPEN;
  }

  async closeSession(clientId: string): Promise<boolean> {
    const session = this.wsSessions.get(clientId);
    if (!session) return false;

    try {
      if (session.pveWs.readyState === WebSocket.OPEN) {
        session.pveWs.close();
      }

      await this.sessionRepository.closeSession(session.dbSessionId);
      this.wsSessions.delete(clientId);
      this.logger.log(`WebSocket session closed: ${clientId}`);

      return true;
    } catch (error) {
      this.logger.error(`Error closing session: ${error}`);
      return false;
    }
  }

  onData(clientId: string, callback: (data: string) => void): boolean {
    const session = this.wsSessions.get(clientId);
    if (!session) return false;

    session.pveWs.on('message', (data: WebSocket.Data) => {
      const strData = data.toString();
      session.lastActivity = new Date();
      callback(strData);
    });

    session.pveWs.on('close', () => {
      callback(JSON.stringify({ type: 'closed' }));
      this.wsSessions.delete(clientId);
    });

    session.pveWs.on('error', (err) => {
      callback(JSON.stringify({ type: 'error', message: err.message }));
    });

    return true;
  }

  // ============ HTTP API методы ============

  async createHttpSession(dto: ConnectConsoleDto): Promise<{
    success: boolean;
    sessionId?: string;
    message?: string;
  }> {
    const { vmId, type = ConsoleType.QEMU, node = 'pve' } = dto;

    try {
      const vm = await this.vmRepository.findByProxmoxId(vmId);
      if (!vm) {
        return { success: false, message: 'VM_NOT_FOUND' };
      }

      const dbSession = await this.sessionRepository.create({
        clientId: `http-${Date.now()}`,
        vmId,
        type,
        node,
        proxmoxVmid: vm.proxmox_id,
        status: ConsoleSessionStatus.CONNECTING,
      });

      const ticketData =
        type === ConsoleType.LXC
          ? await this.proxmox.getLxcTermTicket(node, vm.proxmox_id)
          : await this.proxmox.getVmTermTicket(node, vm.proxmox_id);

      await this.sessionRepository.repo.update(dbSession.id, {
        ticket: ticketData.ticket,
        port: ticketData.port,
      });

      const wsUrl = this.proxmox.buildVncWebSocketUrl(
        node,
        vm.proxmox_id,
        ticketData.port,
        ticketData.ticket,
        type,
      );

      const pveWs = new WebSocket(wsUrl, {
        rejectUnauthorized: false,
        headers: {
          Cookie: `PVEAuthCookie=${encodeURIComponent(ticketData.ticket)}`,
        },
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          pveWs.terminate();
          reject(new Error('WebSocket connection timeout'));
        }, 10000);

        pveWs.on('open', () => {
          clearTimeout(timeout);
          this.logger.log(`Proxmox WS connected: session=${dbSession.id}`);
          resolve();
        });

        pveWs.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      const session: HttpConsoleSession = {
        dbSessionId: dbSession.id,
        pveWs,
        outputBuffer: [],
        eventEmitter: new EventEmitter(),
        lastActivity: new Date(),
      };

      pveWs.on('message', (data: WebSocket.Data) => {
        const strData = data.toString();
        session.outputBuffer.push(strData);
        session.lastActivity = new Date();
        if (session.outputBuffer.length > 1000) {
          session.outputBuffer.shift();
        }
        session.eventEmitter.emit('data', strData);
      });

      pveWs.on('close', async () => {
        await this.sessionRepository.closeSession(dbSession.id);
        this.httpSessions.delete(dbSession.id);
        session.eventEmitter.emit('close');
      });

      pveWs.on('error', (err) => {
        this.logger.error(`Proxmox WS error: ${err.message}`);
        session.eventEmitter.emit('error', err);
      });

      this.httpSessions.set(dbSession.id, session);
      await this.sessionRepository.updateStatus(
        dbSession.id,
        ConsoleSessionStatus.ACTIVE,
      );

      return { success: true, sessionId: dbSession.id };
    } catch (error: any) {
      this.logger.error(`Failed to create session: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  async getHttpSession(sessionId: string) {
    const session = this.httpSessions.get(sessionId);
    const dbSession = await this.sessionRepository.findById(sessionId);

    if (!dbSession) return null;

    return {
      id: dbSession.id,
      vmId: dbSession.vmId,
      type: dbSession.type,
      status: dbSession.status,
      active: !!session && session.pveWs.readyState === WebSocket.OPEN,
      bufferSize: session?.outputBuffer.length || 0,
      createdAt: dbSession.createdAt,
    };
  }

  async sendHttpInput(sessionId: string, data: string): Promise<boolean> {
    const session = this.httpSessions.get(sessionId);
    if (!session || session.pveWs.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      session.pveWs.send(data);
      session.lastActivity = new Date();
      return true;
    } catch {
      return false;
    }
  }

  async getHttpOutput(sessionId: string): Promise<string[]> {
    const session = this.httpSessions.get(sessionId);
    if (!session) return [];

    const output = [...session.outputBuffer];
    session.outputBuffer = [];
    return output;
  }

  async closeHttpSession(sessionId: string): Promise<void> {
    const session = this.httpSessions.get(sessionId);

    if (session) {
      if (session.pveWs.readyState === WebSocket.OPEN) {
        session.pveWs.close();
      }
      this.httpSessions.delete(sessionId);
    }

    await this.sessionRepository.closeSession(sessionId);
    this.logger.log(`HTTP session closed: ${sessionId}`);
  }

  // ============ Общие методы ============

  getStats() {
    return {
      httpSessions: this.httpSessions.size,
      wsSessions: this.wsSessions.size,
      totalActive: this.httpSessions.size + this.wsSessions.size,
    };
  }

  private cleanupInactiveSessions(): void {
    const now = Date.now();

    for (const [sessionId, session] of this.httpSessions.entries()) {
      if (now - session.lastActivity.getTime() > this.SESSION_TIMEOUT) {
        this.closeHttpSession(sessionId).catch((err) => {
          this.logger.error(`HTTP cleanup error: ${err.message}`);
        });
      }
    }

    for (const [clientId, session] of this.wsSessions.entries()) {
      if (now - session.lastActivity.getTime() > this.SESSION_TIMEOUT) {
        this.closeSession(clientId).catch((err) => {
          this.logger.error(`WS cleanup error: ${err.message}`);
        });
      }
    }
  }
}
