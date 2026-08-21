/**
 * What every admin Server Action returns.
 *
 * Lives in its own module rather than alongside the actions: a `"use server"`
 * file may only export async functions, and re-exporting a type from one has
 * been seen to survive compilation as a runtime binding that then blows up on
 * import. Both the actions and the client components that call them import the
 * type from here instead.
 */
export type AdminActionResult = {
  ok: boolean;
  error?: string;
};
