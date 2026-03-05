// src/console/console.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConsoleService } from '../services/console.service';
import {
  ConnectConsoleDto,
  ConsoleMessageDto,
  ConsoleResizeDto,
} from '../dto/connect.console.dto';

@WebSocketGateway({
  namespace: '/console',
  cors: { origin: '*' },
})
export class ConsoleGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ConsoleGateway.name);

  constructor(private readonly consoleService: ConsoleService) {}

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('console:connected', { clientId: client.id });
  }

  @SubscribeMessage('console:connect')
  async handleConnect(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ConnectConsoleDto,
  ): Promise<void> {
    try {
      const result = await this.consoleService.createSession(
        client.id,
        payload,
      );

      if (!result.success) {
        client.emit('console:error', { message: result.message });
        return;
      }

      // Исправлено: используем onData вместо прямого доступа к sessions
      this.consoleService.onData(client.id, (data) => {
        client.emit('console:data', data);
      });

      client.emit('console:ready', {
        vmId: payload.vmId,
        sessionId: result.sessionId,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      this.logger.error(`Connect failed: ${error.message}`);
      client.emit('console:error', {
        message: error.message,
        code: 'UNKNOWN_ERROR',
      });
    }
  }

  @SubscribeMessage('console:input')
  async handleInput(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ConsoleMessageDto,
  ): Promise<void> {
    const success = await this.consoleService.sendInput(
      client.id,
      payload.data,
    );

    if (!success) {
      client.emit('console:error', { message: 'SESSION_NOT_ACTIVE' });
    }
  }

  @SubscribeMessage('console:resize')
  async handleResize(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ConsoleResizeDto,
  ): Promise<void> {
    const success = await this.consoleService.resizeTerminal(
      client.id,
      payload.cols,
      payload.rows,
    );

    if (!success) {
      client.emit('console:error', { message: 'RESIZE_FAILED' });
    }
  }

  @SubscribeMessage('console:status')
  async handleStatus(@ConnectedSocket() client: Socket): Promise<void> {
    const info = await this.consoleService.getSessionInfo(client.id);
    const isActive = this.consoleService.isSessionActive(client.id);

    client.emit('console:status', {
      active: isActive,
      session: info,
    });
  }

  @SubscribeMessage('console:disconnect')
  async handleManualDisconnect(
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.closeClientSession(client);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    // fire and forget с обработкой ошибок
    this.closeClientSession(client).catch((err) => {
      this.logger.error(`Error in disconnect: ${err.message}`);
    });
  }

  // ============ PRIVATE METHODS ============

  private async closeClientSession(client: Socket): Promise<void> {
    const closed = await this.consoleService.closeSession(client.id);
    if (closed) {
      client.emit('console:disconnected', {
        timestamp: new Date().toISOString(),
      });
    }
  }
}
