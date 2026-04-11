export function isEmail(identifier: string): boolean {
  return identifier.includes("@");
}

export function buildUserQuery(identifier: string) {
  return isEmail(identifier)
    ? { email: identifier.toLowerCase() }
    : { username: identifier.toLowerCase() };
}
