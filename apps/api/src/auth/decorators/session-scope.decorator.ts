import { SetMetadata } from '@nestjs/common';
import type { SessionScope } from '../../generated/prisma/enums';

export const SESSION_SCOPE_KEY = 'sessionScope';

/** Which app's session cookie SessionGuard reads. Without it: STOREFRONT. */
export const UseSessionScope = (scope: SessionScope) => SetMetadata(SESSION_SCOPE_KEY, scope);
