# Proxmox Routes Quick Reference (для разработки)

Источник: `proxmox_api_export.json`.

## 1) Аутентификация
- `POST /access/ticket` — логин/проверка ticket.
- `GET /access/ticket` — сервисный endpoint.

## 2) RBAC и доступы
- `GET /access/roles`
- `POST /access/roles`
- `GET /access/roles/{roleid}`
- `PUT /access/roles/{roleid}`
- `DELETE /access/roles/{roleid}`
- `GET /access/users`
- `POST /access/users`
- `GET /access/users/{userid}`
- `PUT /access/users/{userid}`
- `DELETE /access/users/{userid}`
- `GET /access/acl`
- `PUT /access/acl`

## 3) Создание и управление VM (QEMU)
### Базовые
- `GET /nodes/{node}/qemu`
- `POST /nodes/{node}/qemu`
- `DELETE /nodes/{node}/qemu/{vmid}`
- `GET /nodes/{node}/qemu/{vmid}/config`
- `PUT /nodes/{node}/qemu/{vmid}/config`

### Состояние/питание
- `GET /nodes/{node}/qemu/{vmid}/status/current`
- `POST /nodes/{node}/qemu/{vmid}/status/start`
- `POST /nodes/{node}/qemu/{vmid}/status/stop`
- `POST /nodes/{node}/qemu/{vmid}/status/reboot`
- `POST /nodes/{node}/qemu/{vmid}/status/shutdown`

### Снапшоты
- `GET /nodes/{node}/qemu/{vmid}/snapshot`
- `POST /nodes/{node}/qemu/{vmid}/snapshot`
- `DELETE /nodes/{node}/qemu/{vmid}/snapshot/{snapname}`
- `POST /nodes/{node}/qemu/{vmid}/snapshot/{snapname}/rollback`

## 4) Создание и управление LXC
### Базовые
- `GET /nodes/{node}/lxc`
- `POST /nodes/{node}/lxc`
- `DELETE /nodes/{node}/lxc/{vmid}`
- `GET /nodes/{node}/lxc/{vmid}/config`
- `PUT /nodes/{node}/lxc/{vmid}/config`

### Состояние/питание
- `GET /nodes/{node}/lxc/{vmid}/status/current`
- `POST /nodes/{node}/lxc/{vmid}/status/start`
- `POST /nodes/{node}/lxc/{vmid}/status/stop`
- `POST /nodes/{node}/lxc/{vmid}/status/reboot`
- `POST /nodes/{node}/lxc/{vmid}/status/shutdown`

### Снапшоты
- `GET /nodes/{node}/lxc/{vmid}/snapshot`
- `POST /nodes/{node}/lxc/{vmid}/snapshot`
- `DELETE /nodes/{node}/lxc/{vmid}/snapshot/{snapname}`
- `POST /nodes/{node}/lxc/{vmid}/snapshot/{snapname}/rollback`

## 5) Консоль и командная строка
### Для VM
- `POST /nodes/{node}/qemu/{vmid}/vncproxy`
- `GET /nodes/{node}/qemu/{vmid}/vncwebsocket`
- `POST /nodes/{node}/qemu/{vmid}/termproxy`

### Для LXC
- `POST /nodes/{node}/lxc/{vmid}/vncproxy`
- `GET /nodes/{node}/lxc/{vmid}/vncwebsocket`
- `POST /nodes/{node}/lxc/{vmid}/termproxy`

### Shell на ноде
- `POST /nodes/{node}/termproxy`
- `POST /nodes/{node}/vncshell`
- `POST /nodes/{node}/spiceshell`

## 6) Метрики и мониторинг
### Кластер
- `GET /cluster/resources`
- `GET /cluster/status`
- `GET /version`

### Нода
- `GET /nodes/{node}/status`
- `GET /nodes/{node}/rrddata`
- `GET /nodes/{node}/syslog`

### VM/LXC
- `GET /nodes/{node}/qemu/{vmid}/rrddata`
- `GET /nodes/{node}/lxc/{vmid}/rrddata`

### Storage
- `GET /nodes/{node}/storage/{storage}/status`
- `GET /nodes/{node}/storage/{storage}/rrddata`

## 7) Storage и диски
- `GET /storage`
- `POST /storage`
- `GET /storage/{storage}`
- `PUT /storage/{storage}`
- `DELETE /storage/{storage}`
- `GET /nodes/{node}/storage`
- `GET /nodes/{node}/storage/{storage}/content`
- `POST /nodes/{node}/storage/{storage}/content`
- `POST /nodes/{node}/storage/{storage}/upload`
- `POST /nodes/{node}/qemu/{vmid}/move_disk`
- `PUT /nodes/{node}/qemu/{vmid}/resize`
- `POST /nodes/{node}/lxc/{vmid}/move_volume`
- `PUT /nodes/{node}/lxc/{vmid}/resize`

## 8) Пулы (tenant boundaries)
- `GET /pools`
- `POST /pools`
- `PUT /pools`
- `DELETE /pools`

## 9) Async-задачи (UPID)
- `GET /nodes/{node}/tasks`
- `GET /nodes/{node}/tasks/{upid}`
- `GET /nodes/{node}/tasks/{upid}/status`
- `GET /nodes/{node}/tasks/{upid}/log`
- `DELETE /nodes/{node}/tasks/{upid}`

## 10) Квоты — что реально есть
В Proxmox API нет отдельного универсального endpoint типа `tenant quotas`.

Практика для вашей платформы:
1. Квоты хранить в backend (PostgreSQL) на уровне tenant/user.
2. Технические лимиты накладывать через config VM/LXC и ACL.
3. Фактическое потребление брать из:
   - `GET /cluster/resources`
   - `GET /nodes/{node}/rrddata`
   - `GET /nodes/{node}/qemu/{vmid}/rrddata`
   - `GET /nodes/{node}/lxc/{vmid}/rrddata`
   - `GET /nodes/{node}/storage/{storage}/status`
