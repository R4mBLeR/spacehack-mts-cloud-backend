import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles'; // ключ должен совпадать!
export const HasRoles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
