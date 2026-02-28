# Аудит новых изменений (`eaa142c` -> `e41a8d3`)

После последнего обновления ветки `master` ваш друг исправил два предыдущих бага и попытался внедрить `HttpOnly Cookie`. Однако в процессе был внесен новый критический баг, который полностью ломает авторизацию в приложении.

## 1. Исправленные баги

- **Успешно исправлено:** Ошибка передачи пароля вместо `username` в `users.service.ts`.
- **Успешно исправлено:** Двойное хеширование пароля. Добавлены хуки `@AfterLoad()` и сохранение состояния пароля в свойство `originalPassword`, с которым сверяется `@BeforeUpdate()`. Это решает проблему.

---

## 2. Новый Критический Баг: Поломанный Refresh логики и Cookies 🚨

Изменение в `auth.controller.ts`: Ваш друг сделал так, что `register` и `login` возвращают `refresh_token` не в заголовках, а в виде безопасной куки:

```typescript
res.cookie('refresh_token', tokensPair.refreshToken, {
  httpOnly: true, // ...
});
```

Это отличная инициатива для безопасности, но **она осталась недоделанной и теперь приложение не работает**.

### В чем проблема?

1. Фронтенд (или мобильное приложение) получает `refresh_token` как `HttpOnly` куку. Это значит, что JavaScript (код клиента) **не может ее прочитать**.
2. Однако эндпоинты `/api/auth/refresh`, `/api/auth/logout` и `/api/auth/logout_all` **по-прежнему ожидают `refresh_token` в заголовке `Authorization: Bearer <token>`**:

```typescript
async refresh(@Headers('authorization') authorizationHeader: string) { ... }
```

3. Клиент не может достать токен из куки, чтобы положить его в заголовок. Даже если браузер сам отправляет куку при следующем запросе, бекенд не может ее прочитать, так как NestJS не настроен читать куки (нет библиотеки `cookie-parser`), и в логике контроллера жестко прописано чтение из заголовка!

**Следствие:** Ни один пользователь теперь не сможет обновить токен сессии (refresh) или выйти из системы (logout). Они будут получать `401 Unauthorized` (`INVALID_AUTHORIZATION_HEADER`).

### Решение:

Необходимо довести внедрение куки до конца:

1. Установить и подключить middleware для чтения кук (`npm i cookie-parser`, `npm i -D @types/cookie-parser`).
2. В `main.ts` добавить:
   ```typescript
   import * as cookieParser from 'cookie-parser';
   // ...
   app.use(cookieParser());
   ```
3. В `AuthController` переделать методы `refresh`, `logout`, `logout_all`:
   Вместо `@Headers('authorization')` нужно использовать декоратор для чтения кук:

   ```typescript
   import { Req } from '@nestjs/common';
   import { Request } from 'express';

   @Post('refresh')
   async refresh(@Req() req: Request) {
     const token = req.cookies['refresh_token'];
     if (!token) throw new UnauthorizedException('...');

     // И необходимо добавить новый токен обратно в куки перед возвратом ответа так же, как в login:
     // ...
   }
   ```

4. Обновить Swagger `@ApiCookieAuth('refresh_token')` вместо `@ApiBearerAuth` для этих методов.
