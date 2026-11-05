import type { Env } from "./api";
import { runTimers } from "./timers";
export default {
  fetch() {
    return new Response("Not found", { status: 404 });
  },
  async scheduled(_controller: ScheduledController, env: Env) {
    await runTimers(env);
  },
};
