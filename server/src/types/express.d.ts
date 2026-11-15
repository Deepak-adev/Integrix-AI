import type { OrganisationContext } from './index.js';

declare global {
  namespace Express {
    interface Request {
      /**
       * Trusted organisation context populated by the organisation-resolution
       * middleware. Never populated from client-supplied request data.
       */
      organisation?: OrganisationContext;
    }
  }
}

export {};
