import { timerDispatchHeaders } from "./timerDispatch";
interface TimerEnv {
  TALIN_TIMER_TOKEN?: string;
}
export default {
  fetch() {
    return new Response("Not found", { status: 404 });
  },
  async scheduled(_controller: ScheduledController, env: TimerEnv) {
    if (
      !env.TALIN_TIMER_TOKEN ||
      !/^[0-9a-f]{64}$/i.test(env.TALIN_TIMER_TOKEN)
    )
      return;
    // No credential redirects or retries. D1 claims prevent duplicate delivery.
    const response = await fetch(
      "https://talin-dock.pages.dev/api/timer-runner",
      {
        method: "POST",
        headers: await timerDispatchHeaders(env.TALIN_TIMER_TOKEN),
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(25000),
      },
    );
    if (!response.ok) throw new Error("Timer dispatch was not acknowledged");
  },
};
