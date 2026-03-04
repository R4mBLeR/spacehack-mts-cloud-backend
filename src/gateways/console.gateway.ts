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
  ) {}

  /**
   * Клиент подключается и отправляет:
   *   { vmId: number, type: 'qemu' | 'lxc' }
   *
   * В ответ получает 'console:ready' или 'console:error'.
   */
  @SubscribeMessage('console:connect')
  async handleConnect(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { vmId: number; type?: 'qemu' | 'lxc' },
  ): Promise<void> {
    const type = payload.type || 'qemu';
    const node = 'pve';

    try {
      // Находим proxmox_id по внутреннему id
      const vm = await this.vmRepository.findVmById(payload.vmId);
      if (!vm) {
        client.emit('console:error', { message: 'VM_NOT_FOUND' });
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
