/** Random id for a new record (also used as its id in the account). */
export function newId() {
  return crypto.randomUUID();
}
