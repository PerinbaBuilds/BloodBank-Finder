import { Request } from "express";

/**
 * Express 5's ParamsDictionary types values as `string | string[]` (path-to-regexp
 * can produce arrays for repeating segments), but none of our routes use repeating
 * params, so this narrows back to the plain string every caller actually expects.
 */
export function getParam(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] : value;
}
