/**
 * Ids arrive from the URL, where anything at all can be typed. Postgres will
 * not compare a uuid column against "abc": it raises, and the visitor gets a
 * 500 for what is really just a wrong address. Checking the shape first turns
 * those back into the honest 404 they are.
 */
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | undefined | null): value is string {
  return typeof value === "string" && UUID.test(value);
}
