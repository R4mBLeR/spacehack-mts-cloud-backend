# Code Review — Pull `e41a8d3..7fef0f0`

> Дата: 3 марта 2026  
> Контекст: Space Hackathon with MTC — MVP IaaS-платформы (NestJS + PostgreSQL + Proxmox)

---

## 1. Что было добавлено

### 1.1. Модуль VPS (полный CRUD виртуальных машин)

| Файл | Назначение |
|---|---|
| `src/models/vm.entity.ts` | Entity `VirtualMachine` — `proxmox_id`, `name`, `user_id`, `status` (enum: CREATING/RUNNING/STOPPED/ERROR) |
| `src/models/vm.configuration.ts` | Value-object `VmConfiguration` — cpu, ram, ssd с валидацией через class-validator |
| `src/dto/create-vm.dto.ts` | DTO для создания VM (name + configuration) |
| `src/dto/update-vm.dto.ts` | DTO для обновления VM (name + configuration) |
| `src/dto/change.vm.status.dto.ts` | DTO для stop/delete (только id) |
| `src/repositories/vm.repository.ts` | Репозиторий — CRUD-операции с БД |
| `src/services/vps.service.ts` | Бизнес-логика VPS: create, findAll, findOne, update, stop, delete |
| `src/controllers/vps.controller.ts` | REST-контроллер: `POST /vps`, `GET /vps`, `GET /vps/:id`, `PATCH /vps/update_plan`, `DELETE /vps/delete`, `POST /vps/stop` |
| `src/modules/vps.module.ts` | NestJS-модуль, объединяющий все VPS-компоненты |

### 1.2. Переработка авторизации (Cookie-based Refresh)

- **Refresh-токен** перемещён из заголовков в **httpOnly cookie** (`refresh_token`).
- Добавлен `cookie-parser` middleware в `main.ts`.
- Эндпоинты `refresh`, `logout`, `logout_all` теперь читают токен из `req.cookies`.
- При login/register сервер ставит cookie с параметрами: `httpOnly: true`, `secure: true`, `sameSite: 'strict'`, `maxAge: 7 дней`.
- Access-токен возвращается через заголовок `access_token` (через `res.setHeader`).
- Swagger дополнен `@ApiCookieAuth('refresh_token')`.

### 1.3. Изменения в инфраструктуре

- **Dockerfile**: обновлён на `node:25` / `node:25-slim`.
- **CORS**: добавлен `exposedHeaders: ['authorization']`, `credentials: true`.
- **Database module**: добавлена entity `VirtualMachine` в список entities.
- **App module**: подключен `VpsModule`.
- **Swagger**: расширен VPS-эндпоинтами, добавлены схемы VM.

### 1.4. Документация

- `audit.md` — аудит безопасности v1.
- `audit_v2.md` — аудит безопасности v2.
- `architecture.md` — обновлена архитектура проекта.

---

## 2. Баги (критические и средние)

### 🔴 BUG-1 (CRITICAL): `updateVm` — передаётся `userId` вместо VM `id`

**Файл:** `src/controllers/vps.controller.ts` строка ~63  
**Файл:** `src/services/vps.service.ts` строка ~80

Контроллер вызывает:
```ts
return await this.vpsService.update(userId, updateVmDto);
```

Но сервис ожидает **ID виртуальной машины**:
```ts
async update(id: number, updateVmDto: UpdateVmDto): Promise<VirtualMachine> {
    const existingVm = await this.vmRepository.findVmById(id); // ← ищет VM по userId!
```

**Результат:** Вместо обновления нужной VM, ищется VM с `id === userId`. Если совпадёт — обновится чужая VM. Если нет — 404.

**Исправление:** `UpdateVmDto` должен содержать поле `vmId`, а контроллер — передавать его:
```ts
return await this.vpsService.update(updateVmDto.vmId, userId, updateVmDto);
```
И в сервисе добавить проверку, что `vm.user_id === userId`.

---

### 🔴 BUG-2 (CRITICAL): `UpdateVmDto` не содержит ID виртуальной машины

**Файл:** `src/dto/update-vm.dto.ts`

DTO имеет только `name` и `configuration`. Невозможно указать, **какую именно VM** обновлять. Эндпоинт `PATCH /vps/update_plan` не принимает `:id` ни из URL, ни из body.

---

### 🔴 BUG-3 (CRITICAL): Конфигурация VM (`configuration`) **не сохраняется в БД**

**Файл:** `src/models/vm.entity.ts`

Entity `VirtualMachine` содержит только:
- `proxmox_id`
- `name`
- `user_id`
- `status`

**Нет колонок** для `cpu`, `ram`, `ssd` (или embedded `configuration`). При `createVm` в репозитории:
```ts
const vm = this.repository.create(createUserDto);
```
Поля `configuration` просто **игнорируются** TypeORM и не попадают в базу.

**Исправление:** Добавить колонки в entity:
```ts
@Column({ type: 'jsonb', nullable: true })
configuration: VmConfiguration;
```
Или отдельные колонки `cpu`, `ram`, `ssd`.

---

### 🟡 BUG-4 (MEDIUM): Валидация `VmConfiguration` не срабатывает

**Файлы:** `src/dto/create-vm.dto.ts`, `src/dto/update-vm.dto.ts`

Используется `@Allow()` вместо `@ValidateNested()`:
```ts
@Allow()
configuration: VmConfiguration;
```

`@Allow()` лишь говорит pipe'у «не удалять это поле», но **не запускает** вложенную валидацию `@IsInt()`, `@Min()`, `@Max()` внутри `VmConfiguration`. Клиент может прислать `{ cpu: -100, ram: "abc", ssd: null }` и это пройдёт.

**Исправление:**
```ts
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@ValidateNested()
@Type(() => VmConfiguration)
configuration: VmConfiguration;
```

---

### 🟡 BUG-5 (MEDIUM): `ChangeVmStatusDto.id` без валидации

**Файл:** `src/dto/change.vm.status.dto.ts`

Поле `id` не имеет декораторов валидации. При `whitelist: true` + `forbidNonWhitelisted: true` в GlobalPipes, поле без декоратора **может быть отброшено**.

**Исправление:**
```ts
@IsInt()
@IsNotEmpty()
id: number;
```

---

### 🟡 BUG-6 (MEDIUM): `NotFoundException` вместо `ForbiddenException` при отсутствии доступа

**Файл:** `src/services/vps.service.ts`, методы `stop` и `delete`

```ts
if (vm.user_id !== user_id) {
    throw new NotFoundException('VIRTUAL_MACHINE_NO_ACCESS');
}
```

`NotFoundException` (404) — неверный HTTP-код для отказа в доступе. Должен быть `ForbiddenException` (403).

---

### 🟡 BUG-7 (MEDIUM): `findOne` не проверяет принадлежность VM пользователю

**Файл:** `src/controllers/vps.controller.ts`

```ts
@HasRoles(Roles.USER)
@Get(':id')
async findOne(@Param('id') id: number): Promise<VirtualMachine> {
    return this.vpsService.findOne(+id);
}
```

Любой авторизованный пользователь может получить информацию о **любой** VM по ID. Нет проверки `vm.user_id === currentUserId`.

---

### 🟡 BUG-8 (MEDIUM): CORS `exposedHeaders` не включает `access_token`

**Файл:** `src/main.ts`

```ts
exposedHeaders: ['authorization'],
```

Но access-токен ставится через:
```ts
res.setHeader('access_token', tokensPair.accessToken);
```

Браузер **не увидит** заголовок `access_token` в ответе, потому что exposed только `authorization`. Нужно или отправлять токен в `authorization`, или добавить `access_token` в `exposedHeaders`.

---

### 🟡 BUG-9 (MEDIUM): `JwtService` без конфигурации в `VpsModule` и `UsersModule`

**Файлы:** `src/modules/vps.module.ts`, `src/modules/users.module.ts`

```ts
providers: [VpsService, VmRepository, JwtService, AuthUtils],
```

`JwtService` создаётся напрямую **без секрета**. В `AuthModule` используется `JwtModule.registerAsync` с `ConfigService` (читает `JWT_SECRET` из env). Но в `VpsModule`/`UsersModule` — голый `JwtService` без настроек.

Это работает **только если** секрет совпадает с fallback `'your-secret-key'` в `RolesGuard`. Но это хардкод — в production будет расхождение секретов.

**Исправление:** Импортировать `AuthModule` или `JwtModule.registerAsync` вместо прямого `JwtService`:
```ts
imports: [
  TypeOrmModule.forFeature([VirtualMachine]),
  JwtModule.registerAsync({ ... }), // с ConfigService
],
```

---

### 🟢 BUG-10 (LOW): `console.log` в продакшн-коде

**Файлы:**
- `src/auth/guards/roles.guard.ts` — `console.log(payload.roles);`
- `src/main.ts` — `console.log('=== VALIDATION ERRORS ===')` в exceptionFactory

Дебаг-логи не должны попадать в продакшн. Используйте `Logger` из `@nestjs/common`.

---

### 🟢 BUG-11 (LOW): Некорректный комментарий в `vm.repository.ts`

**Файл:** `src/repositories/vm.repository.ts` — строка 1:
```ts
// repositories/user.repository.ts - Только работа с БД
```
Скопировано из `user.repository.ts`. Также импортируются `User` и `CreateUserDto`, которые не используются.

---

### 🟢 BUG-12 (LOW): DELETE-запрос с `@Body()`

**Файл:** `src/controllers/vps.controller.ts`

```ts
@Delete('delete')
async deleteVm(@Body() deleteVmDto: ChangeVmStatusDto)
```

HTTP-спецификация не гарантирует, что тело DELETE-запроса будет обработано. Многие клиенты и прокси его отбрасывают. Лучше использовать `@Param('id')` или `@Query('id')`:
```ts
@Delete(':id')
async deleteVm(@Param('id') id: number, @CurrentUserId() userId: number)
```

---

## 3. Рекомендации по улучшению

### 3.1. Архитектурные

| # | Рекомендация | Приоритет |
|---|---|---|
| 1 | **Добавить интеграцию с Proxmox API.** Сейчас VPS-модуль — чисто CRUD в PostgreSQL. Для хакатона нужно минимум: `POST /nodes/{node}/qemu` (создание VM), `POST /nodes/{node}/qemu/{vmid}/status/stop` (остановка), `DELETE /nodes/{node}/qemu/{vmid}`. Рекомендуется создать `ProxmoxService` | 🔴 High |
| 2 | **Добавить эндпоинты `start` и `restart` для VM.** Есть `stop` и `delete`, но нет способа запустить остановленную VM | 🔴 High |
| 3 | **Endpoint `GET /vps/my`** — для получения всех VM текущего пользователя. `findByUserId` уже есть в сервисе, но не подключен к контроллеру | 🟡 Medium |
| 4 | **Добавить `expires_at` в `Session` entity.** Сейчас refresh-токены **никогда не истекают** в БД. Cookie истекает, но сессия остаётся навечно. Нужна TTL + cron-задача для очистки | 🟡 Medium |
| 5 | **Вынести конфигурацию JWT в shared-модуль.** Сейчас `JwtModule.registerAsync` дублируется / отсутствует в разных модулях. Один общий модуль решит проблему | 🟡 Medium |
| 6 | **Добавить `@IsEnum()` валидацию для статусов VM** в DTO, если планируется управление статусом через API | 🟢 Low |

### 3.2. Безопасность

| # | Рекомендация | Приоритет |
|---|---|---|
| 1 | **Rate limiting** — нет защиты от брутфорса на `/auth/login`. Добавить `@nestjs/throttler` | 🔴 High |
| 2 | **Helmet** — нет middleware для security-заголовков. `npm i helmet` + `app.use(helmet())` | 🟡 Medium |
| 3 | **Убрать хардкод-секрет** `'your-secret-key'` из `roles.guard.ts`. Если `JWT_SECRET` не задан в env — приложение должно падать при старте, а не работать с предсказуемым секретом | 🔴 High |
| 4 | **Добавить `@Exclude()` на `password`** поле при возврате `User` из `register`/`login`. Сейчас `ClassSerializerInterceptor` обрабатывает это через `@Exclude()` на entity, но убедитесь, что `password` не утекает в нестандартных сценариях | 🟢 Low |
| 5 | **`sameSite: 'strict'`** может мешать cross-origin запросам с фронтенда. Для SPA на другом домене лучше `'lax'` или `'none'` (с `secure: true`) | 🟡 Medium |

### 3.3. Качество кода

| # | Рекомендация | Приоритет |
|---|---|---|
| 1 | **Типизировать `@Res()` и `@Req()`** — сейчас `res` и `req` без типов (`any`). Использовать `Response` и `Request` из express | 🟢 Low |
| 2 | **Использовать `PartialType(CreateVmDto)`** для `UpdateVmDto` вместо дублирования полей | 🟢 Low |
| 3 | **Использовать `ParseIntPipe`** в `@Param('id')` для VPS-контроллера — сейчас `+id` ручной cast | 🟢 Low |
| 4 | **Swagger-документация VPS-эндпоинтов** — добавить `@ApiResponse()`, `@ApiOperation()` для всех VPS-эндпоинтов | 🟢 Low |
| 5 | **Убрать дублирование `findAllMachines` / `findAllVm`** в `vm.repository.ts` — два идентичных метода | 🟢 Low |

### 3.4. Готовность к хакатону

| # | Что скорее всего спросят жюри | Статус |
|---|---|---|
| 1 | Создание реальной VM через Proxmox API | ❌ Не реализовано |
| 2 | VLAN/VXLAN изоляция клиентов | ❌ Не реализовано |
| 3 | noVNC консоль (хотя бы проброс) | ❌ Не реализовано |
| 4 | Мониторинг/метрики VM | ❌ Не реализовано |
| 5 | Биллинг / квоты пользователей | ⚠️ Есть поле `balance`, но не используется |
| 6 | Загрузка/выбор ОС при создании VM | ❌ Нет поля `os_template` в DTO/Entity |
| 7 | JWT авторизация + RBAC | ✅ Работает |
| 8 | CRUD пользователей | ✅ Работает |
| 9 | REST API + Swagger | ✅ Работает |
| 10 | Docker-деплой | ✅ Работает |

---

## 4. Сводка

| Категория | Кол-во |
|---|---|
| 🔴 Критические баги | 3 (update по userId вместо vmId, конфигурация не сохраняется, UpdateVmDto без id) |
| 🟡 Средние баги | 6 |
| 🟢 Мелкие замечания | 3 |
| Рекомендации по улучшению | 17 |

**Главный приоритет перед хакатоном:**
1. Исправить BUG-1, BUG-2, BUG-3 (VPS-модуль по сути нерабочий)
2. Добавить `ProxmoxService` для реального создания VM
3. Убрать хардкод JWT-секрета
4. Починить CORS `exposedHeaders`
5. Добавить `start`/`restart` эндпоинты
