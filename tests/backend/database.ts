/// <reference types="@cloudflare/workers-types" />
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { readFileSync } from "node:fs";
export function database() {
  const sql = new DatabaseSync(":memory:");
  for (const name of [
    "0001_household.sql",
    "0002_alexa_commands.sql",
    "0003_power_timers.sql",
    "0004_tuya.sql",
  ])
    sql.exec(
      readFileSync(
        new URL(`../../migrations/${name}`, import.meta.url),
        "utf8",
      ),
    );
  const prepare = (query: string) => {
    let args: SQLInputValue[] = [];
    const statement = sql.prepare(query);
    const result = {
      bind(...values: SQLInputValue[]) {
        args = values;
        return result;
      },
      async first() {
        return statement.get(...args) || null;
      },
      async all() {
        return { results: statement.all(...args) };
      },
      async run() {
        return { meta: { changes: Number(statement.run(...args).changes) } };
      },
    };
    return result;
  };
  return {
    sql,
    db: {
      prepare,
      batch: async (statements: { run: () => Promise<unknown> }[]) =>
        Promise.all(statements.map((s) => s.run())),
    } as unknown as D1Database,
  };
}
