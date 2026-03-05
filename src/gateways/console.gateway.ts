import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import WebSocket from 'ws';
import https from 'https';
import { ProxmoxService } from '../api/proxmox.service';
import { VmRepository } from '../repositories/vm.repository';

interface ConsoleSession {
  pveWs: WebSocket;
  vmId: number;
}

@WebSocketGateway({
  namespace: '/console',
  cors: { origin: '*' },
})
export class ConsoleGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ConsoleGateway.name);
  private sessions = new Map<string, ConsoleSession>();

  constructor(
    private readonly proxmox: ProxmoxService,
    private readonly vmRepository: VmRepository,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Извлечь и проверить JWT из socket.io handshake.
   * Поддерживает:
   *   - socket.handshake.auth.token
   *   - socket.handshake.headers.authorization  (Bearer ...)
   * Возвращает userId или null.
   */
  private extractUserId(client: Socket): number | null {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) return null;

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });
      return payload.id ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Клиент подключается и отправляет:
   *   { vmId: number, type: 'qemu' | 'lxc' }
   *
   * Требуется JWT-токен в handshake.auth.token или в Authorization header.
   * В ответ получает 'console:ready' или 'console:error'.
   */
  @SubscribeMessage('console:connect')
  async handleConnect(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { vmId: number; type?: 'qemu' | 'lxc' },
  ): Promise<void> {
    // ── Auth ──────────────────────────────────────────────
    const userId = this.extractUserId(client);
    if (!userId) {
      client.emit('console:error', { message: 'AUTH_REQUIRED' });
      return;
    }

    const type = payload.type || 'qemu';
    const node = 'pve';

    try {
      // Находим proxmox_id по внутреннему id
      const vm = await this.vmRepository.findVmById(payload.vmId);
      if (!vm) {
        client.emit('console:error', { message: 'VM_NOT_FOUND' });
        return;
      }

      // ── Ownership check ────────────────────────────────
      if (vm.user_id !== userId) {
        client.emit('console:error', { message: 'VM_NO_ACCESS' });
        return;
      }

      // Получаем VNC ticket
      const { ticket, port } =
        type === 'lxc'
          ? await this.proxmox.getLxcTermTicket(node, vm.proxmox_id)
          : await this.proxmox.getVmTermTicket(node, vm.proxmox_id);

      // Собираем URL для WebSocket Proxmox
      const wsUrl = this.proxmox.buildVncWebSocketUrl(
        node,
        vm.proxmox_id,
        port,
        ticket,
        type,
      );

      // Открываем сырой WS к Proxmox
      const pveWs = new WebSocket(wsUrl, {
        agent: new https.Agent({ rejectUnauthorized: false }),
        headers: {
          Cookie: `PVEAuthCookie=${encodeURIComponent(ticket)}`,
        },
      });

      pveWs.on('open', () => {
        this.logger.log(
          `Proxmox WS opened for vm ${vm.proxmox_id} (client ${client.id})`,
        );
        client.emit('console:ready', { vmId: payload.vmId });
      });

      // Proxmox → клиент
      pveWs.on('message', (data: WebSocket.Data) => {
        client.emit('console:data', data.toString());
      });

      pveWs.on('close', () => {
        this.logger.log(`Proxmox WS closed (client ${client.id})`);
        client.emit('console:closed');
        this.sessions.delete(client.id);
      });

      pveWs.on('error', (err) => {
        this.logger.error(`Proxmox WS error: ${err.message}`);
        client.emit('console:error', { message: err.message });
      });

      this.sessions.set(client.id, { pveWs, vmId: payload.vmId });
    } catch (err: any) {
      this.logger.error(`Console connect failed: ${err.message}`);
      client.emit('console:error', { message: err.message });
    }
  }

  /**
   * Клиент отправляет ввод (keystroke / paste) → Proxmox.
   */
  @SubscribeMessage('console:input')
  handleInput(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: string,
  ): void {
    const session = this.sessions.get(client.id);
    if (session?.pveWs?.readyState === WebSocket.OPEN) {
      session.pveWs.send(data);
    }
  }

  /**
   * Клиент отключился — закрываем Proxmox WS.
   */
  handleDisconnect(client: Socket): void {
    const session = this.sessions.get(client.id);
    if (session) {
      session.pveWs.close();
      this.sessions.delete(client.id);
      this.logger.log(`Client ${client.id} disconnected, PVE WS closed`);
    }
  }
}
