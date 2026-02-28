# Аудит изменений и предложения по рефакторингу

## 1. Что изменилось в последних коммитах (`6d3b180` -> `eaa142c`)

### Архитектурные изменения

- **Разделение логики:** `AuthService` был перемещен из общей папки `src/services/` в выделенный домен `src/auth/auth.service.ts`.
- **Сессии:** В `SessionRepository` добавлены методы для отзыва `refresh_token`: `deleteSessionByToken` (текущей ссесии) и `deleteAllSession` (всех сессий пользователя).
- **Контроллеры:** В `AuthController` добавлены 3 новых эндпоинта: `/change_password`, `/logout`, `/logout_all`.
- **User Service:** Логика обновления пользователя (`users.service.ts` -> `update`) была переписана. Теперь поддерживается изменение `email` с проверкой на дубликаты. Однако изменение любых полей жестко требует введения текущего пароля (передается в DTO как `password`).

---

## 2. Найденные критические баги 🚨

### Баг 1: Ошибка фильтрации при регистрации (`users.service.ts`)

В методе `create()` в `users.service.ts` есть критическая ошибка в переданных аргументах в репозиторий:

```typescript
const existingUsers = await this.userRepository.findUsersByEmailOrUsername(
  createUserDto.email,
  createUserDto.username,
);
```

**Следствие:** При регистрации `findUsersByEmailOrUsername` ищет пользователя с таким же `email` или с `username` равным ВВЕДЕННОМУ ПАРОЛЮ. Из-за этого другие пользователи смогут зарегистрироваться с **таким же `username`**, если их email отличается. На уровне сервиса это не отловится, но запрос упадет с системной ошибкой на уровне базы данных из-за ограничения уникальности поля `username`.
**Решение:** Поменять `createUserDto.password` на `createUserDto.username`.

### Баг 2: Повторное хеширование пароля при обновлении профиля (`user.entity.ts` + `users.service.ts`)

В `User` Entity определен хук, который срабатывает при сохранении документа:

```typescript
@BeforeUpdate()
async hashPassword(): Promise<void> {
  if (this.password) {
    const bcryptService = new AuthUtils();
    this.password = await bcryptService.hashPassword(this.password);
  }
}
```

Метод `update` в `UsersService` вызывает `this.userRepository.save(existingUser)` после изменения других полей (например, `firstName`).
Поскольку свойство `existingUser.password` не было изменено, но оно было загружено из базы напрямую (в виде хеша), TypeORM все равно выполняет хук `@BeforeUpdate()` и **ВТОРОЙ РАЗ хеширует уже захешированный пароль**.
**Следствие:** При **любом** изменении профиля через логику `UsersService.update()`, пользователь теряет доступ к аккаунту навсегда, так как его пароль ломается!
**Решение:** В хуке TypeORM нужно проверять, был ли пароль действительно изменен в этом запросе (`this.isModified` или подобное). Однако надежнее всего: удалить хук `@BeforeUpdate()` и хешировать пароли только явно внутри сервисов перед `.save()`.

---

## 3. Предложения по рефакторингу, упрощению кода и архитектуры

### Оптимизация валидации и контроллеров

- **Глобальная валидация (Pipes):** В `main.ts` стоит добавить `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));` чтобы автоматически отбрасывать любые поля, которых нет в DTO.
- **Инжект Репозиториев:** Сейчас `UserRepository` и `SessionRepository` реализованы как кастомные провайдеры-классы, расширяющие `Repository`. В чистом NestJS рекомендуется использовать встроенный паттерн `@InjectRepository(User)`.
- **Логика паролей:** В `auth.service.ts` метод `changePassword` бросает исключение `PASSWORDS_IS_DUPLICATE` (почему-то статус 401 Unauthorized), если новый пароль совпадает со старым. Логичнее бросать `BadRequestException` (статус 400), так как это ошибка валидации бизнес-логики со стороны клиента.

### Улучшение безопасности и скорости работы

1. **Токены в куках (HttpOnly):** Рекомендуется перевести `refresh_token` в `HttpOnly Cookie`. Сейчас они возвращаются в заголовках, что заставляет мобильных и фронтенд разработчиков хранить их в небезопасных хранилищах (например, AsyncStorage).
2. **Transaction Management:** Метод `changePassword` делает два вызова манипуляции с базой: обновление `User` (`save`) и инвалидацию всех сессий (`deleteAllSession`). Если первый процесс удастся, а база упадет на втором, останется устаревшая сессия. Логику нужно обернуть в TypeORM-транзакцию (например, через `QueryRunner`).
3. **Хранение секретов:** В `AuthModule` JWT_SECRET возможно хардкодится. Это нужно рефакторить, чтобы секрет всегда получался из `ConfigModule`.

---

## 4. Обновление документации (Выполнено)

- Обновлен файл `architecture.md`: Добавлены новые слои контроллеров сессии и измененная логика Auth. Описано новое поведение `UsersService`.
- Обновлен файл `swagger.yml`: Добавлены спецификации маршрутов `/api/auth/change_password`, `/logout`, `/logout_all` и схема `ChangePasswordDto`.
