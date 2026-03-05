# Последние изменения бэкенда

---

## 1. Консоль VM/LXC (WebSocket)

### Что сделано

Реализован доступ к терминалу виртуальных машин (QEMU) и LXC-контейнеров через WebSocket.  
Бэкенд выступает **прокси** между браузером и Proxmox VNC WebSocket.

### Архитектура

```
┌──────────┐  socket.io   ┌──────────────┐  raw wss://   ┌──────────┐
│  Браузер │ ◄──────────► │ ConsoleGateway│ ◄───────────► │ Proxmox  │
│ (xterm.js)│  /console   │  (NestJS)    │   vncwebsocket│   VE     │
└──────────┘              └──────────────┘               └──────────┘
```

**Транспорт:** socket.io (namespace `/console`) на стороне клиента, `ws` (raw WebSocket) на стороне Proxmox.

### Файлы

| Файл | Назначение |
|------|-----------|
| `src/gateways/console.gateway.ts` | Socket.io gateway — проксирует ввод/вывод между клиентом и Proxmox |
| `src/api/proxmox.service.ts` | Методы `getVmTermTicket()`, `getLxcTermTicket()`, `buildVncWebSocketUrl()` |
| `src/modules/vps.module.ts` | `ConsoleGateway` зарегистрирован как provider |

### Протокол событий

| Событие | Направление | Payload | Описание |
|---------|------------|---------|----------|
| `console:connect` | Клиент → Сервер | `{ vmId: number, type?: 'qemu' \| 'lxc' }` | Инициирует подключение к консоли VM |
| `console:ready` | Сервер → Клиент | `{ vmId: number }` | Соединение с Proxmox установлено |
| `console:data` | Сервер → Клиент | `string` (терминальный вывод) | Данные из терминала VM |
| `console:input` | Клиент → Сервер | `string` (keystroke/paste) | Пользовательский ввод в терминал |
| `console:error` | Сервер → Клиент | `{ message: string }` | Ошибка подключения |
| `console:closed` | Сервер → Клиент | — | Proxmox WS закрылся |

### Зависимости

```bash
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io ws
npm install -D @types/ws
```

---

## 2. Как подключить консоль на фронте

### Установка

```bash
npm install socket.io-client xterm @xterm/addon-fit
```

### Минимальный пример (React + xterm.js)

```tsx
// ConsoleTerminal.tsx
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';

interface Props {
  vmId: number;
  type?: 'qemu' | 'lxc';
  token: string; // JWT access token
}

export function ConsoleTerminal({ vmId, type = 'qemu', token }: Props) {
  const termRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Создаём xterm
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      theme: { background: '#1e1e2e' },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(termRef.current!);
    fitAddon.fit();

    // 2. Подключаемся к бэкенду через socket.io
    const socket: Socket = io('http://BACKEND_HOST:3000/console', {
      auth: { token },            // JWT для аутентификации
      transports: ['websocket'],  // сразу WS, без long-polling
    });

    // 3. Просим бэк открыть консоль VM
    socket.emit('console:connect', { vmId, type });

    // 4. Получаем данные из терминала VM
    socket.on('console:ready', () => {
      term.writeln('\x1b[32m● Подключено к консоли\x1b[0m\r\n');
    });

    socket.on('console:data', (data: string) => {
      term.write(data);
    });

    socket.on('console:error', ({ message }: { message: string }) => {
      term.writeln(`\x1b[31mОшибка: ${message}\x1b[0m`);
    });

    socket.on('console:closed', () => {
      term.writeln('\r\n\x1b[33m● Соединение закрыто\x1b[0m');
    });

    // 5. Отправляем пользовательский ввод
    term.onData((data: string) => {
      socket.emit('console:input', data);
    });

    // 6. Ресайз
    const onResize = () => fitAddon.fit();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      socket.disconnect();
      term.dispose();
    };
  }, [vmId, type, token]);

  return <div ref={termRef} style={{ width: '100%', height: '100%' }} />;
}
```

### Использование

```tsx
<ConsoleTerminal vmId={42} type="qemu" token={accessToken} />
```

### Чистый JS (без React)

```js
import { io } from 'socket.io-client';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';

const term = new Terminal({ cursorBlink: true });
const fit = new FitAddon();
term.loadAddon(fit);
term.open(document.getElementById('terminal'));
fit.fit();

const socket = io('http://BACKEND_HOST:3000/console', {
  auth: { token: 'JWT_TOKEN_HERE' },
  transports: ['websocket'],
});

socket.emit('console:connect', { vmId: 42, type: 'qemu' });

socket.on('console:data', (data) => term.write(data));
socket.on('console:ready', () => term.writeln('Connected'));
socket.on('console:error', ({ message }) => term.writeln(`Error: ${message}`));

term.onData((data) => socket.emit('console:input', data));
```

---

## 3. RBAC — управление ролями, пользователями и ACL через Proxmox API

### Что сделано

Полная реализация CRUD для трёх разделов Proxmox Access API:

- **Roles** — создание/редактирование/удаление кастомных ролей с привилегиями
- **PVE Users** — управление пользователями Proxmox (создание, обновление, удаление)
- **ACL** — назначение роли пользователю/группе на конкретный путь ресурса

Все эндпоинты защищены `RolesGuard` — доступны **только администраторам** (`Roles.ADMIN`).

### Файлы

| Файл | Назначение |
|------|-----------|
| `src/controllers/rbac.controller.ts` | REST-контроллер `@Controller('rbac')` |
| `src/services/rbac.service.ts` | Бизнес-логика + обработка ошибок Proxmox |
| `src/modules/rbac.module.ts` | NestJS-модуль (зарегистрирован в AppModule) |
| `src/dto/rbac/create-role.dto.ts` | DTO создания роли |
| `src/dto/rbac/update-role.dto.ts` | DTO обновления роли |
| `src/dto/rbac/create-pve-user.dto.ts` | DTO создания PVE-пользователя |
| `src/dto/rbac/update-pve-user.dto.ts` | DTO обновления PVE-пользователя |
| `src/dto/rbac/update-acl.dto.ts` | DTO назначения ACL |
| `src/api/proxmox.service.ts` | 12 новых методов для `/access/*` API |

### API-эндпоинты

Все маршруты требуют JWT с ролью `admin`.  
Базовый путь: `/rbac`

#### Roles

| Метод | Путь | Body / Params | Описание |
|-------|------|---------------|----------|
| `GET` | `/rbac/roles` | — | Список всех ролей Proxmox |
| `GET` | `/rbac/roles/:roleid` | — | Детали роли |
| `POST` | `/rbac/roles` | `{ roleid: string, privs: string }` | Создать роль |
| `PUT` | `/rbac/roles/:roleid` | `{ privs: string, append?: boolean }` | Обновить привилегии |
| `DELETE` | `/rbac/roles/:roleid` | — | Удалить роль |

#### PVE Users

| Метод | Путь | Body / Params | Описание |
|-------|------|---------------|----------|
| `GET` | `/rbac/users?enabled=true` | query: `enabled` (опц.) | Список PVE-пользователей |
| `GET` | `/rbac/users/:userid` | — | Детали пользователя |
| `POST` | `/rbac/users` | `{ userid, password?, email?, firstname?, lastname?, groups?, comment?, enable? }` | Создать пользователя |
| `PUT` | `/rbac/users/:userid` | `{ email?, firstname?, lastname?, groups?, comment?, enable? }` | Обновить пользователя |
| `DELETE` | `/rbac/users/:userid` | — | Удалить пользователя |

#### ACL

| Метод | Путь | Body / Params | Описание |
|-------|------|---------------|----------|
| `GET` | `/rbac/acl` | — | Все ACL-записи |
| `PUT` | `/rbac/acl` | `{ path, roles, users?, groups?, propagate?, delete? }` | Назначить / удалить ACL |

### Примеры curl

#### Создать роль TenantAdmin

```bash
curl -X POST http://localhost:3000/rbac/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleid": "TenantAdmin",
    "privs": "VM.Audit,VM.Console,VM.PowerMgmt,VM.Config.Disk,VM.Config.CPU,VM.Config.Memory,VM.Config.Network"
  }'
```

#### Создать PVE-пользователя

```bash
curl -X POST http://localhost:3000/rbac/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userid": "john@pve",
    "password": "securePass123",
    "email": "john@example.com",
    "firstname": "John",
    "enable": true
  }'
```

#### Назначить ACL: роль TenantAdmin → пользователь john@pve → на VM 100

```bash
curl -X PUT http://localhost:3000/rbac/acl \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/vms/100",
    "roles": "TenantAdmin",
    "users": "john@pve",
    "propagate": true
  }'
```

#### Удалить ACL-запись

```bash
curl -X PUT http://localhost:3000/rbac/acl \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/vms/100",
    "roles": "TenantAdmin",
    "users": "john@pve",
    "delete": true
  }'
```

### Маппинг на Proxmox API

| Наш эндпоинт | Proxmox API |
|---------------|-------------|
| `POST /rbac/roles` | `POST /access/roles` |
| `PUT /rbac/roles/:id` | `PUT /access/roles/{roleid}` |
| `DELETE /rbac/roles/:id` | `DELETE /access/roles/{roleid}` |
| `POST /rbac/users` | `POST /access/users` |
| `PUT /rbac/users/:id` | `PUT /access/users/{userid}` |
| `DELETE /rbac/users/:id` | `DELETE /access/users/{userid}` |
| `PUT /rbac/acl` | `PUT /access/acl` |

### Модель назначения прав (сводка)

```
                ┌─────────────┐
                │  Proxmox VE │
                └──────┬──────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   /access/roles  /access/users  /access/acl
        │              │              │
   ┌────┴────┐    ┌────┴────┐    ┌────┴────────────────┐
   │  Роли   │    │  Юзеры  │    │  path + role + user │
   │  +privs │    │ user@pve│    │  = назначение прав  │
   └─────────┘    └─────────┘    └─────────────────────┘

Пример:
  1. POST /rbac/roles         → создать роль "Monitor" с privs "VM.Audit,Sys.Audit"
  2. POST /rbac/users         → создать пользователя "ops@pve"
  3. PUT  /rbac/acl           → привязать роль "Monitor" к "ops@pve" на path "/"
```
