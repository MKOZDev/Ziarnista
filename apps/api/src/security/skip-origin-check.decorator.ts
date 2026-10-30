import { SetMetadata } from '@nestjs/common';

export const SKIP_ORIGIN_CHECK_KEY = 'skipOriginCheck';

/**
 * Opts a route out of OriginGuard. Only for server-to-server calls that authenticate
 * themselves another way (e.g. the Stripe webhook, verified by its signature).
 */
export const SkipOriginCheck = () => SetMetadata(SKIP_ORIGIN_CHECK_KEY, true);
