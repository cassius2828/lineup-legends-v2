import { teardown } from "./seed-test-user";

export default async function globalTeardown() {
  await teardown();
}
