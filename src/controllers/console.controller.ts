// src/console/console.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConnectConsoleDto } from '../dto/connect.console.dto';
import { ConsoleService } from '../services/console.service';

@Controller('console')
export class ConsoleController {
  constructor(private readonly consoleService: ConsoleService) {}

  /**
   * Создать консольную сессию (HTTP)
   * POST /console/connect
   */
  @Post('connect')
  async connect(@Body() dto: ConnectConsoleDto) {
    const result = await this.consoleService.createHttpSession(dto);

    if (!result.success) {
      throw new BadRequestException(result.message);
    }

    return {
      sessionId: result.sessionId,
      wsUrl: `/console/ws/${result.sessionId}`, // WebSocket endpoint
      status: 'created',
    };
  }

  /**
   * Получить статус сессии
   * GET /console/sessions/:sessionId
   */
  @Get('sessions/:sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    const session = await this.consoleService.getHttpSession(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    return session;
  }

  /**
   * Отправить команду в сессию (HTTP polling)
   * POST /console/sessions/:sessionId/input
   */
  @Post('sessions/:sessionId/input')
  @HttpCode(HttpStatus.NO_CONTENT)
  async sendInput(
    @Param('sessionId') sessionId: string,
    @Body('data') data: string,
  ) {
    const success = await this.consoleService.sendHttpInput(sessionId, data);
    if (!success) {
      throw new BadRequestException('Session not active');
    }
  }

  /**
   * Получить вывод из сессии (HTTP polling)
   * GET /console/sessions/:sessionId/output
   */
  @Get('sessions/:sessionId/output')
  async getOutput(@Param('sessionId') sessionId: string) {
    const output = await this.consoleService.getHttpOutput(sessionId);
    return { output };
  }

  /**
   * Закрыть сессию
   * DELETE /console/sessions/:sessionId
   */
  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disconnect(@Param('sessionId') sessionId: string) {
    await this.consoleService.closeHttpSession(sessionId);
  }

  /**
   * Получить статистику
   * GET /console/stats
   */
  @Get('stats')
  getStats() {
    return this.consoleService.getStats();
  }
}
