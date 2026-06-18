declare global {
  namespace Express {
    interface Request {
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
      userId?: string;
      userRole?: import("@prisma/client").Role;
    }
  }
}

export {};
