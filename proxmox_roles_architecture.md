# RBAC архитектура MTS Cloud (Proxmox)

Источник методов: [proxmox_api_export.json](proxmox_api_export.json).

---

## Общая модель назначения прав

1. Создать роль: `POST /access/roles`
2. Обновить привилегии: `PUT /access/roles/{roleid}`
3. Создать пользователя: `POST /access/users`
4. Назначить роль на path: `PUT /access/acl`

---

## SuperAdmin

**Описание:** Полный контроль платформы и tenants.

**Proxmox Privs:** ALL privs

**Paths:** `/`, `/vms/*`, `/storage/*`, `/pool/*`, `/access/*`

**Создание в API:** Predefined Administrator (отдельного создания не требует).

**Связанные методы:**

| Действие | Метод | URL |
|---|---|---|
| Статус кластера | GET | `/cluster/status` |
| Ресурсы кластера | GET | `/cluster/resources` |
| Версия API | GET | `/version` |
| Статус ноды | GET | `/nodes/{node}/status` |
| Reboot/shutdown ноды | POST | `/nodes/{node}/status` |
| Управление пользователями | GET/POST | `/access/users` |
| Управление ролями | GET/POST | `/access/roles` |
| Управление ACL | GET/PUT | `/access/acl` |
| Управление storage | GET/POST | `/storage` |
| Управление пулами | GET/POST/PUT/DELETE | `/pools` |
| Список задач | GET | `/nodes/{node}/tasks` |
| Статус задачи | GET | `/nodes/{node}/tasks/{upid}/status` |
| Создание VM | POST | `/nodes/{node}/qemu` |
| Создание LXC | POST | `/nodes/{node}/lxc` |
| Удаление VM | DELETE | `/nodes/{node}/qemu/{vmid}` |
| Удаление LXC | DELETE | `/nodes/{node}/lxc/{vmid}` |

---

## DCAdmin

**Описание:** ЦОД-администратор — генерит пароли VDS, approve, работа с железом.

**Proxmox Privs:** `Sys.Modify`, `Sys.PowerMgmt`, `Permissions.Modify`, `User.Modify`, `VM.Allocate`, `VM.Console`, `Datastore.AllocateSpace`

**Paths:** `/nodes/*`, `/vms/*`, `/access/users`, `/storage/*`

**Создание в API:**
```
POST /access/roles
{ roleid: "DCAdmin", privs: "Sys.Modify Sys.PowerMgmt Permissions.Modify User.Modify VM.Allocate VM.Console Datastore.AllocateSpace" }

PUT /access/acl
{ path: "/nodes", users: "dcadmin@pam", roles: "DCAdmin", propagate: 1 }
```

**Связанные методы:**

| Действие | Метод | URL |
|---|---|---|
| Создание VM | POST | `/nodes/{node}/qemu` |
| Создание LXC | POST | `/nodes/{node}/lxc` |
| Start VM | POST | `/nodes/{node}/qemu/{vmid}/status/start` |
| Stop VM | POST | `/nodes/{node}/qemu/{vmid}/status/stop` |
| Start LXC | POST | `/nodes/{node}/lxc/{vmid}/status/start` |
| Stop LXC | POST | `/nodes/{node}/lxc/{vmid}/status/stop` |
| Смена пароля в VM (guest-agent) | POST | `/nodes/{node}/qemu/{vmid}/agent/set-user-password` |
| Консоль VM | POST | `/nodes/{node}/qemu/{vmid}/termproxy` |
| Консоль LXC | POST | `/nodes/{node}/lxc/{vmid}/termproxy` |
| Статус ноды | GET | `/nodes/{node}/status` |
| Reboot/shutdown ноды | POST | `/nodes/{node}/status` |
| Управление storage | GET/POST/PUT | `/storage`, `/storage/{storage}` |
| Storage статус | GET | `/nodes/{node}/storage/{storage}/status` |
| Загрузка образов | POST | `/nodes/{node}/storage/{storage}/upload` |
| Скачка по URL | POST | `/nodes/{node}/storage/{storage}/download-url` |
| Управление пользователями | GET/POST/PUT | `/access/users`, `/access/users/{userid}` |
| Назначение ACL | PUT | `/access/acl` |
| Задачи ноды | GET | `/nodes/{node}/tasks` |
| Статус задачи | GET | `/nodes/{node}/tasks/{upid}/status` |
| Лог задачи | GET | `/nodes/{node}/tasks/{upid}/log` |

---

## TenantAdmin

**Описание:** Корпоративный админ тенанта — квоты, баланс, VDC.

**Proxmox Privs:** `VM.Allocate`, `VM.Config.*`, `VM.PowerMgmt`, `VM.Console`, `Datastore.AllocateSpace`, `Pool.Allocate`

**Paths:** `/pool/tenant{tenantId}`, `/vms/tenant{tenantId}*`, `/storage/minio`

**Создание в API (per-tenant):**
```
POST /access/roles
{ roleid: "TenantAdmin_{tenantId}", privs: "VM.Allocate VM.Config.Disk VM.Config.CPU VM.Config.Memory VM.Config.Network VM.Config.Options VM.PowerMgmt VM.Console Datastore.AllocateSpace Pool.Allocate" }

POST /pools
{ poolid: "tenant-{tenantId}" }

PUT /access/acl
{ path: "/pool/tenant-{tenantId}", users: "tenantadmin@pam", roles: "TenantAdmin_{tenantId}", propagate: 1 }
```

**Связанные методы:**

| Действие | Метод | URL |
|---|---|---|
| Создание VM | POST | `/nodes/{node}/qemu` |
| Создание LXC | POST | `/nodes/{node}/lxc` |
| Конфиг VM | GET/PUT | `/nodes/{node}/qemu/{vmid}/config` |
| Конфиг LXC | GET/PUT | `/nodes/{node}/lxc/{vmid}/config` |
| Start/Stop/Reboot VM | POST | `/nodes/{node}/qemu/{vmid}/status/start\|stop\|reboot` |
| Start/Stop/Reboot LXC | POST | `/nodes/{node}/lxc/{vmid}/status/start\|stop\|reboot` |
| Консоль VM | POST | `/nodes/{node}/qemu/{vmid}/vncproxy` |
| Консоль VM WS | GET | `/nodes/{node}/qemu/{vmid}/vncwebsocket` |
| Консоль LXC | POST | `/nodes/{node}/lxc/{vmid}/vncproxy` |
| Resize диска VM | PUT | `/nodes/{node}/qemu/{vmid}/resize` |
| Resize диска LXC | PUT | `/nodes/{node}/lxc/{vmid}/resize` |
| Управление пулами | GET/POST/PUT/DELETE | `/pools` |
| Storage статус | GET | `/nodes/{node}/storage/{storage}/status` |
| Содержимое storage | GET | `/nodes/{node}/storage/{storage}/content` |

**Примечание:** Proxmox не имеет нативного `tenantId`. Изоляция строится через ACL path + pool naming + разделение ролей.

---

## User

**Описание:** Конечный пользователь — свои VDS в лимитах.

**Proxmox Privs:** `VM.Audit`, `VM.Console`, `VM.PowerMgmt`, `VM.Config.Options`, `VM.Snapshot`

**Paths:** `/vms/{userVmid}` (конкретные VM)

**Создание в API:**
```
POST /access/users
{ userid: "user@pam" }

PUT /access/acl
{ path: "/vms/{vmid}", users: "user@pam", roles: "User" }
```

**Связанные методы:**

| Действие | Метод | URL |
|---|---|---|
| Статус VM | GET | `/nodes/{node}/qemu/{vmid}/status/current` |
| Start VM | POST | `/nodes/{node}/qemu/{vmid}/status/start` |
| Stop VM | POST | `/nodes/{node}/qemu/{vmid}/status/stop` |
| Reboot VM | POST | `/nodes/{node}/qemu/{vmid}/status/reboot` |
| Shutdown VM | POST | `/nodes/{node}/qemu/{vmid}/status/shutdown` |
| Консоль VNC | POST | `/nodes/{node}/qemu/{vmid}/vncproxy` |
| Консоль WS | GET | `/nodes/{node}/qemu/{vmid}/vncwebsocket` |
| Консоль term | POST | `/nodes/{node}/qemu/{vmid}/termproxy` |
| Список снапшотов | GET | `/nodes/{node}/qemu/{vmid}/snapshot` |
| Создать снапшот | POST | `/nodes/{node}/qemu/{vmid}/snapshot` |
| Удалить снапшот | DELETE | `/nodes/{node}/qemu/{vmid}/snapshot/{snapname}` |
| Откат снапшота | POST | `/nodes/{node}/qemu/{vmid}/snapshot/{snapname}/rollback` |
| Конфиг VM (read) | GET | `/nodes/{node}/qemu/{vmid}/config` |

---

## DCOperator

**Описание:** Обслуживание компов, hardware, диагностика.

**Proxmox Privs:** `Sys.Audit`, `Sys.Console`, `Sys.Syslog`, `VM.Audit`, `Node.Audit`

**Paths:** `/nodes/{node}`, `/syslog`

**Создание в API:**
```
POST /access/roles
{ roleid: "DCOperator", privs: "Sys.Audit Sys.Console Sys.Syslog VM.Audit" }

PUT /access/acl
{ path: "/nodes", users: "operator@pam", roles: "DCOperator", propagate: 1 }
```

**Связанные методы:**

| Действие | Метод | URL |
|---|---|---|
| Статус ноды | GET | `/nodes/{node}/status` |
| Syslog | GET | `/nodes/{node}/syslog` |
| Список задач | GET | `/nodes/{node}/tasks` |
| Детали задачи | GET | `/nodes/{node}/tasks/{upid}` |
| Статус задачи | GET | `/nodes/{node}/tasks/{upid}/status` |
| Лог задачи | GET | `/nodes/{node}/tasks/{upid}/log` |
| Ресурсы кластера | GET | `/cluster/resources` |
| Статус кластера | GET | `/cluster/status` |
| Метрики ноды | GET | `/nodes/{node}/rrddata` |
| Shell ноды | POST | `/nodes/{node}/termproxy` |
| Статус VM (audit) | GET | `/nodes/{node}/qemu/{vmid}/status/current` |
| Статус LXC (audit) | GET | `/nodes/{node}/lxc/{vmid}/status/current` |
| Subscription | GET | `/nodes/{node}/subscription` |

---

## BillingViewer

**Описание:** Просмотр транзакций и аудит (read-only).

**Proxmox Privs:** `Sys.Audit`, `Mapping.Audit`

**Paths:** `/` (read-only)

**Создание в API:** Опционально.
```
POST /access/roles
{ roleid: "BillingViewer", privs: "Sys.Audit Mapping.Audit" }

PUT /access/acl
{ path: "/", users: "billing@pam", roles: "BillingViewer", propagate: 1 }
```

**Связанные методы:**

| Действие | Метод | URL |
|---|---|---|
| Ресурсы кластера | GET | `/cluster/resources` |
| Статус кластера | GET | `/cluster/status` |
| Версия API | GET | `/version` |
| Статус ноды | GET | `/nodes/{node}/status` |
| Метрики ноды | GET | `/nodes/{node}/rrddata` |
| Storage статус | GET | `/nodes/{node}/storage/{storage}/status` |

**Примечание:** В Proxmox нет billing API. Биллинг/транзакции ведутся на уровне вашего backend в PostgreSQL; эта роль получает только read-only метрики из Proxmox для дашборда.

---

## Monitor

**Описание:** Только метрики — для Flutter-виджета.

**Proxmox Privs:** `VM.Audit`, `Sys.Audit`

**Paths:** `/vms/*` (metrics), `/nodes/*`

**Создание в API:**
```
POST /access/roles
{ roleid: "Monitor", privs: "VM.Audit Sys.Audit" }

PUT /access/acl
{ path: "/", users: "monitor@pam", roles: "Monitor", propagate: 1 }
```

**Связанные методы:**

| Действие | Метод | URL |
|---|---|---|
| Ресурсы кластера | GET | `/cluster/resources` |
| Метрики ноды (rrd) | GET | `/nodes/{node}/rrddata` |
| Метрики VM (rrd) | GET | `/nodes/{node}/qemu/{vmid}/rrddata` |
| Метрики LXC (rrd) | GET | `/nodes/{node}/lxc/{vmid}/rrddata` |
| Метрики storage (rrd) | GET | `/nodes/{node}/storage/{storage}/rrddata` |
| Статус VM | GET | `/nodes/{node}/qemu/{vmid}/status/current` |
| Статус LXC | GET | `/nodes/{node}/lxc/{vmid}/status/current` |
| Статус ноды | GET | `/nodes/{node}/status` |

---

## Шаблон ACL для мультитенантности

Рекомендуемые naming conventions:
- Pool: `tenant-{tenantId}`
- Role: `TenantAdmin_{tenantId}`
- User: `user-{tenantId}-{login}@pve`

Поток создания тенанта:
1. `POST /access/roles` → TenantAdmin_{tenantId}
2. `PUT /access/roles/{roleid}` → зафиксировать privs
3. `POST /pools` → tenant-{tenantId}
4. `PUT /access/acl` → роль на `/pool/tenant-{tenantId}`
5. `PUT /access/acl` → точечные права на `/vms/{vmid}` для User
