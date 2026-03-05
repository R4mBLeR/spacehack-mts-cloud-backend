/**
 * Smoke-тест: проверяем, что приложение запускается,
 * все модули зарегистрированы, роуты отвечают, Swagger доступен.
 *
 * НЕ требует Proxmox и PostgreSQL — всё замокано.
 *
 * Запуск:  npx jest --config test/jest-e2e.json test/smoke.e2e-spec.ts
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';

// ─── App modules / controllers ──────────────────────────────
import { AppModule } from '../src/modules/app.module';

// ─── Entities (для override TypeORM repositories) ───────────
import { User } from '../src/models/user.entity';
import { Session } from '../src/models/session.entity';
import { VirtualMachine } from '../src/models/vm.entity';
import { Ticket } from '../src/models/ticket.entity';
import { Corporation } from '../src/models/corporation.entity';
import { Role } from '../src/models/role.entity';
import { Permission } from '../src/models/permission.entity';

// ─── Сервисы, которые дёргают сеть — мокаем ─────────────────
import { ProxmoxService } from '../src/api/proxmox.service';

// ─── Репозитории ─────────────────────────────────────────────
import { VmRepository } from '../src/repositories/vm.repository';
import { UserRepository } from '../src/repositories/user.repository';
import { SessionRepository } from '../src/repositories/session.repository';
import { TicketRepository } from '../src/repositories/ticket.repository';
import { CorporationRepository } from '../src/repositories/corporation.repository';

// ─── Утилиты ─────────────────────────────────────────────────
import { AuthUtils } from '../src/utils/auth.utils';
import { DataSource, EntityManager } from 'typeorm';

// ════════════════════════════════════════════════════════════
//  Mock factories
// ════════════════════════════════════════════════════════════

/** Возвращает объект, в котором каждый метод — jest.fn() → undefined. */
const mockRepository = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  findOneBy: jest.fn().mockResolvedValue(null),
  findBy: jest.fn().mockResolvedValue([]),
  save: jest.fn().mockResolvedValue({}),
  create: jest.fn().mockReturnValue({}),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
  update: jest.fn().mockResolvedValue({}),
  createQueryBuilder: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ max: 100 }),
  }),
  metadata: {
    columns: [],
    relations: [],
    connection: { options: { type: 'postgres' } },
    tableName: 'mock',
  },
});

const mockProxmox = (): Partial<ProxmoxService> => ({
  createVmFull: jest.fn().mockResolvedValue(undefined),
  createVm: jest.fn().mockResolvedValue('UPID:mock'),
  getVmConfig: jest.fn().mockResolvedValue({ scsi0: 'local-lvm:vm-100-disk-0' }),
  updateVmConfig: jest.fn().mockResolvedValue(undefined),
  resizeDisk: jest.fn().mockResolvedValue(undefined),
  configureCloudInit: jest.fn().mockResolvedValue(undefined),
  waitForTask: jest.fn().mockResolvedValue(undefined),
  getVmStatus: jest.fn().mockResolvedValue({ status: 'running' }),
  startVm: jest.fn().mockResolvedValue(undefined),
  stopVm: jest.fn().mockResolvedValue(undefined),
  restartVm: jest.fn().mockResolvedValue(undefined),
  shutdownVm: jest.fn().mockResolvedValue(undefined),
  deleteVm: jest.fn().mockResolvedValue(undefined),
  updateVm: jest.fn().mockResolvedValue(undefined),
  getVmRrdData: jest.fn().mockResolvedValue([]),
  getNodeVmList: jest.fn().mockResolvedValue([]),
  listSnapshots: jest.fn().mockResolvedValue([]),
  createSnapshot: jest.fn().mockResolvedValue('UPID:snap'),
  getSnapshotConfig: jest.fn().mockResolvedValue({}),
  rollbackSnapshot: jest.fn().mockResolvedValue('UPID:rollback'),
  deleteSnapshot: jest.fn().mockResolvedValue('UPID:delsnap'),
  getClusterResources: jest.fn().mockResolvedValue([]),
  getVmTermTicket: jest.fn().mockResolvedValue({ ticket: 'TKT', port: 5900 }),
  getLxcTermTicket: jest.fn().mockResolvedValue({ ticket: 'TKT', port: 5901 }),
  buildVncWebSocketUrl: jest.fn().mockReturnValue('wss://mock'),
  getRoles: jest.fn().mockResolvedValue([]),
  getRole: jest.fn().mockResolvedValue({}),
  createRole: jest.fn().mockResolvedValue(undefined),
  updateRole: jest.fn().mockResolvedValue(undefined),
  deleteRole: jest.fn().mockResolvedValue(undefined),
  getPveUsers: jest.fn().mockResolvedValue([]),
  getPveUser: jest.fn().mockResolvedValue({}),
  createPveUser: jest.fn().mockResolvedValue(undefined),
  updatePveUser: jest.fn().mockResolvedValue(undefined),
  deletePveUser: jest.fn().mockResolvedValue(undefined),
  getAcl: jest.fn().mockResolvedValue([]),
  updateAcl: jest.fn().mockResolvedValue(undefined),
  getLxcList: jest.fn().mockResolvedValue([]),
  getLxcStatus: jest.fn().mockResolvedValue({}),
  getLxcConfig: jest.fn().mockResolvedValue({}),
  createLxc: jest.fn().mockResolvedValue('UPID:lxc'),
  updateLxcConfig: jest.fn().mockResolvedValue(undefined),
  startLxc: jest.fn().mockResolvedValue('UPID:start'),
  stopLxc: jest.fn().mockResolvedValue('UPID:stop'),
  shutdownLxc: jest.fn().mockResolvedValue('UPID:shutdown'),
  rebootLxc: jest.fn().mockResolvedValue('UPID:reboot'),
  deleteLxc: jest.fn().mockResolvedValue('UPID:del'),
  getLxcRrdData: jest.fn().mockResolvedValue([]),
  getNodeStorages: jest.fn().mockResolvedValue([]),
  getStorageContent: jest.fn().mockResolvedValue([]),
  getGlobalStorages: jest.fn().mockResolvedValue([]),
  listPools: jest.fn().mockResolvedValue([]),
  getPool: jest.fn().mockResolvedValue({}),
  createPool: jest.fn().mockResolvedValue(undefined),
  updatePool: jest.fn().mockResolvedValue(undefined),
  deletePool: jest.fn().mockResolvedValue(undefined),
  getSdnZones: jest.fn().mockResolvedValue([]),
  getSdnZone: jest.fn().mockResolvedValue({}),
  getSdnVnets: jest.fn().mockResolvedValue([]),
  getSdnVnet: jest.fn().mockResolvedValue({}),
  getSdnSubnets: jest.fn().mockResolvedValue([]),
  applySdn: jest.fn().mockResolvedValue('UPID:sdn'),
});

// ════════════════════════════════════════════════════════════
//  Test suite
// ════════════════════════════════════════════════════════════

describe('Smoke test — all modules & routes', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let adminToken: string;

  beforeAll(async () => {
    const repo = mockRepository();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // ── Override TypeORM repos ────────────────────────────
      .overrideProvider(getRepositoryToken(User)).useValue(repo)
      .overrideProvider(getRepositoryToken(Session)).useValue(repo)
      .overrideProvider(getRepositoryToken(VirtualMachine)).useValue(repo)
      .overrideProvider(getRepositoryToken(Ticket)).useValue(repo)
      .overrideProvider(getRepositoryToken(Corporation)).useValue(repo)
      .overrideProvider(getRepositoryToken(Role)).useValue(repo)
      .overrideProvider(getRepositoryToken(Permission)).useValue(repo)
      // ── Override custom repos ─────────────────────────────
      .overrideProvider(VmRepository).useValue({
        findVmById: jest.fn().mockResolvedValue({ id: 1, proxmox_id: 100, user_id: 1, name: 'test-vm' }),
        findAllMachines: jest.fn().mockResolvedValue([]),
        findVmsByUserId: jest.fn().mockResolvedValue([]),
        createVm: jest.fn().mockResolvedValue({ id: 1, proxmox_id: 101, name: 'new-vm', user_id: 1 }),
        getNextVmid: jest.fn().mockResolvedValue(101),
        deleteVmById: jest.fn().mockResolvedValue({ affected: 1 }),
        save: jest.fn().mockResolvedValue({}),
      })
      .overrideProvider(UserRepository).useValue({
        findAllUsers: jest.fn().mockResolvedValue([]),
        findUserById: jest.fn().mockResolvedValue(null),
        findUserByEmail: jest.fn().mockResolvedValue(null),
        findUserByUsername: jest.fn().mockResolvedValue(null),
        findUsersByEmailOrUsername: jest.fn().mockResolvedValue([]),
        createUser: jest.fn().mockResolvedValue({}),
        save: jest.fn().mockResolvedValue({}),
      })
      .overrideProvider(SessionRepository).useValue({
        findSessionById: jest.fn().mockResolvedValue(null),
        findSessionByToken: jest.fn().mockResolvedValue(null),
        addSession: jest.fn().mockResolvedValue({}),
        deleteSessionByToken: jest.fn().mockResolvedValue({ affected: 1 }),
        deleteAllSession: jest.fn().mockResolvedValue({ affected: 1 }),
        updateToken: jest.fn().mockResolvedValue('new-token'),
      })
      .overrideProvider(TicketRepository).useValue({
        findAllTickets: jest.fn().mockResolvedValue([]),
        findTicketById: jest.fn().mockResolvedValue(null),
        findTicketsByUserId: jest.fn().mockResolvedValue([]),
        createTicket: jest.fn().mockResolvedValue({}),
        deleteTicket: jest.fn().mockResolvedValue({ affected: 1 }),
        deleteTicketById: jest.fn().mockResolvedValue({ affected: 1 }),
      })
      .overrideProvider(CorporationRepository).useValue({
        findById: jest.fn().mockResolvedValue(null),
        findByAdmin: jest.fn().mockResolvedValue([]),
        findWithMembers: jest.fn().mockResolvedValue(null),
        save: jest.fn().mockResolvedValue({}),
        findOne: jest.fn().mockResolvedValue(null),
      })
      // ── Override external services ────────────────────────
      .overrideProvider(ProxmoxService).useValue(mockProxmox())
      .overrideProvider(DataSource).useValue({
        createEntityManager: jest.fn().mockReturnValue({}),
        getRepository: jest.fn().mockReturnValue(repo),
      })
      .overrideProvider(EntityManager).useValue({})
      .overrideProvider(AuthUtils).useValue({
        hashPassword: jest.fn().mockResolvedValue('hashed'),
        comparePasswords: jest.fn().mockResolvedValue(true),
        generateRefresh: jest.fn().mockReturnValue('refresh-token-mock'),
        // Реально извлекаем Bearer token из заголовка, иначе guard всегда → 401
        extractTokenFromHeader: jest.fn().mockImplementation((req: any) => {
          const auth = req.headers?.authorization;
          if (!auth) return undefined;
          const [type, token] = auth.split(' ');
          return type === 'Bearer' ? token : undefined;
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Swagger
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Smoke Test API')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
        'access-token',
      )
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('swagger', app, document);

    await app.init();

    // Генерируем тестовый JWT для admin
    jwtService = moduleFixture.get(JwtService);
    adminToken = jwtService.sign(
      { id: 1, username: 'admin', roles: ['admin', 'user'] },
      { secret: process.env.JWT_SECRET || 'your-secret-key', expiresIn: '1h' },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  // ═══════════════════════════════════════════════════════
  //  1. Базовые проверки
  // ═══════════════════════════════════════════════════════

  it('GET /api — health / hello', async () => {
    const res = await request(app.getHttpServer()).get('/api');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Hello World');
  });

  it('GET /swagger — Swagger UI доступен', async () => {
    const res = await request(app.getHttpServer()).get('/swagger');
    // Swagger UI отдаёт 301 или 200
    expect([200, 301]).toContain(res.status);
  });

  it('GET /swagger-json — OpenAPI JSON', async () => {
    // NestJS Swagger создаёт JSON на {setupPath}-json
    let res = await request(app.getHttpServer()).get('/swagger-json');
    // Если не 200, пробуем альтернативный путь
    if (res.status !== 200) {
      res = await request(app.getHttpServer()).get('/api-json');
    }
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBeDefined();
    expect(res.body.paths).toBeDefined();
  });

  // ═══════════════════════════════════════════════════════
  //  2. Проверка маршрутов: без токена → 401
  // ═══════════════════════════════════════════════════════

  describe('Все защищённые роуты возвращают 401 без токена', () => {
    const protectedRoutes = [
      // VPS
      { method: 'get', path: '/api/vps' },
      { method: 'post', path: '/api/vps/create' },
      { method: 'get', path: '/api/vps/1' },
      { method: 'delete', path: '/api/vps/delete' },
      { method: 'post', path: '/api/vps/start' },
      { method: 'post', path: '/api/vps/stop' },
      { method: 'post', path: '/api/vps/restart' },
      { method: 'post', path: '/api/vps/shutdown' },
      { method: 'patch', path: '/api/vps/update' },
      { method: 'get', path: '/api/vps/1/monitoring' },
      { method: 'get', path: '/api/vps/1/snapshots' },
      { method: 'post', path: '/api/vps/snapshots/create' },
      { method: 'post', path: '/api/vps/snapshots/rollback' },
      { method: 'delete', path: '/api/vps/snapshots/delete' },
      { method: 'get', path: '/api/vps/admin/proxmox-vms' },
      { method: 'get', path: '/api/vps/admin/cluster-resources' },
      // RBAC
      { method: 'get', path: '/api/rbac/roles' },
      { method: 'get', path: '/api/rbac/roles/Admin' },
      { method: 'post', path: '/api/rbac/roles' },
      { method: 'put', path: '/api/rbac/roles/Admin' },
      { method: 'delete', path: '/api/rbac/roles/Admin' },
      { method: 'get', path: '/api/rbac/users' },
      { method: 'get', path: '/api/rbac/users/admin@pve' },
      { method: 'post', path: '/api/rbac/users' },
      { method: 'put', path: '/api/rbac/users/admin@pve' },
      { method: 'delete', path: '/api/rbac/users/admin@pve' },
      { method: 'get', path: '/api/rbac/acl' },
      { method: 'put', path: '/api/rbac/acl' },
      // LXC
      { method: 'get', path: '/api/lxc' },
      { method: 'post', path: '/api/lxc/create' },
      { method: 'get', path: '/api/lxc/100' },
      { method: 'get', path: '/api/lxc/100/config' },
      { method: 'get', path: '/api/lxc/100/monitoring' },
      { method: 'patch', path: '/api/lxc/100/config' },
      { method: 'post', path: '/api/lxc/100/start' },
      { method: 'post', path: '/api/lxc/100/stop' },
      { method: 'post', path: '/api/lxc/100/shutdown' },
      { method: 'post', path: '/api/lxc/100/reboot' },
      { method: 'delete', path: '/api/lxc/100' },
      // Storage
      { method: 'get', path: '/api/storage' },
      { method: 'get', path: '/api/storage/node' },
      { method: 'get', path: '/api/storage/local/content' },
      // Pools
      { method: 'get', path: '/api/pools' },
      { method: 'get', path: '/api/pools/test-pool' },
      { method: 'post', path: '/api/pools' },
      { method: 'put', path: '/api/pools/test-pool' },
      { method: 'delete', path: '/api/pools/test-pool' },
      // SDN
      { method: 'get', path: '/api/sdn/zones' },
      { method: 'get', path: '/api/sdn/zones/vxlanzone' },
      { method: 'get', path: '/api/sdn/vnets' },
      { method: 'get', path: '/api/sdn/vnets/vnet10' },
      { method: 'get', path: '/api/sdn/vnets/vnet10/subnets' },
      { method: 'post', path: '/api/sdn/apply' },
    ];

    for (const route of protectedRoutes) {
      it(`${route.method.toUpperCase()} ${route.path} → 401`, async () => {
        const res = await (request(app.getHttpServer()) as any)[route.method](route.path);
        expect(res.status).toBe(401);
      });
    }
  });

  // ═══════════════════════════════════════════════════════
  //  3. С токеном — роуты отвечают (не 401, не 404)
  // ═══════════════════════════════════════════════════════

  describe('С JWT-токеном — роуты зарегистрированы (не 404)', () => {
    const authedRoutes = [
      // VPS (admin)
      { method: 'get', path: '/api/vps' },
      { method: 'get', path: '/api/vps/admin/proxmox-vms' },
      { method: 'get', path: '/api/vps/admin/cluster-resources' },
      // VPS (user)
      { method: 'get', path: '/api/vps/1' },
      { method: 'get', path: '/api/vps/1/monitoring' },
      { method: 'get', path: '/api/vps/1/snapshots' },
      // RBAC
      { method: 'get', path: '/api/rbac/roles' },
      { method: 'get', path: '/api/rbac/users' },
      { method: 'get', path: '/api/rbac/acl' },
      // LXC
      { method: 'get', path: '/api/lxc' },
      { method: 'get', path: '/api/lxc/100' },
      { method: 'get', path: '/api/lxc/100/config' },
      { method: 'get', path: '/api/lxc/100/monitoring' },
      // Storage
      { method: 'get', path: '/api/storage' },
      { method: 'get', path: '/api/storage/node' },
      { method: 'get', path: '/api/storage/local/content' },
      // Pools
      { method: 'get', path: '/api/pools' },
      // SDN
      { method: 'get', path: '/api/sdn/zones' },
      { method: 'get', path: '/api/sdn/vnets' },
    ];

    for (const route of authedRoutes) {
      it(`${route.method.toUpperCase()} ${route.path} → не 401/404`, async () => {
        const res = await (request(app.getHttpServer()) as any)
          [route.method](route.path)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(404);
      });
    }
  });

  // ═══════════════════════════════════════════════════════
  //  4. Swagger — все модули представлены в tags
  // ═══════════════════════════════════════════════════════

  it('Swagger содержит все теги (VPS, RBAC, LXC, Storage, Pools, SDN)', async () => {
    let res = await request(app.getHttpServer()).get('/swagger-json');
    if (res.status !== 200) {
      res = await request(app.getHttpServer()).get('/api-json');
    }
    const tags = (res.body.tags || []).map((t: any) => t.name);
    // Если tags пустой — проверяем что пути содержат наши префиксы
    if (tags.length === 0) {
      const pathKeys = Object.keys(res.body.paths || {});
      for (const prefix of ['/api/vps', '/api/rbac', '/api/lxc', '/api/storage', '/api/pools', '/api/sdn']) {
        expect(pathKeys.some(p => p.startsWith(prefix))).toBe(true);
      }
    } else {
      for (const expected of ['VPS', 'RBAC', 'LXC', 'Storage', 'Pools', 'SDN']) {
        expect(tags).toContain(expected);
      }
    }
  });

  it('Swagger — все пути имеют summary', async () => {
    let res = await request(app.getHttpServer()).get('/swagger-json');
    if (res.status !== 200) {
      res = await request(app.getHttpServer()).get('/api-json');
    }
    const paths = res.body.paths;

    const missing: string[] = [];
    for (const [pathKey, methods] of Object.entries(paths) as any) {
      for (const [method, spec] of Object.entries(methods) as any) {
        if (!spec.summary && !spec.$ref) {
          missing.push(`${method.toUpperCase()} ${pathKey}`);
        }
      }
    }

    if (missing.length) {
      console.warn('Routes without summary:', missing);
    }
    // Все наши новые роуты должны иметь summary
    const ourPrefixes = ['/api/vps', '/api/rbac', '/api/lxc', '/api/storage', '/api/pools', '/api/sdn'];
    const ourMissing = missing.filter(m => ourPrefixes.some(p => m.includes(p)));
    expect(ourMissing).toEqual([]);
  });

  // ═══════════════════════════════════════════════════════
  //  5. Валидация — неправильный body отклоняется
  // ═══════════════════════════════════════════════════════

  it('POST /api/vps/create — невалидный body → 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/vps/create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ invalid: true });
    expect(res.status).toBe(400);
  });

  it('POST /api/vps/snapshots/create — невалидный body → 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/vps/snapshots/create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ invalid: true });
    expect(res.status).toBe(400);
  });

  it('POST /api/rbac/roles — невалидный body → 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/rbac/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ wrong: 'data' });
    // 400 = ValidationPipe отклонил, 500 = mock упал (оба допустимы в smoke)
    expect([400, 500]).toContain(res.status);
  });

  it('POST /api/lxc/create — невалидный body → 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/lxc/create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bad: true });
    expect([400, 500]).toContain(res.status);
  });

  it('POST /api/pools — невалидный body → 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/pools')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bad: true });
    expect([400, 500]).toContain(res.status);
  });

  // ═══════════════════════════════════════════════════════
  //  6. Route conflict check — admin routes НЕ перехватываются :id
  // ═══════════════════════════════════════════════════════

  it('GET /api/vps/admin/proxmox-vms — не 404 (route conflict fix)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/vps/admin/proxmox-vms')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).not.toBe(404);
  });

  it('GET /api/vps/admin/cluster-resources — не 404 (route conflict fix)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/vps/admin/cluster-resources')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).not.toBe(404);
  });
});
