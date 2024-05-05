import SqlString from "sqlstring";

const query = <T = unknown>(query: string): Promise<T> =>
  fetch("https://w3x.io/sql", {
    headers: {
      "x-dbproxy-user": "elopublic",
      "x-dbproxy-password": Deno.env.get("SQL_PASSWORD")!,
      "x-dbproxy-database": "elo",
    },
    method: "POST",
    body: query,
  }).then((r) => r.json());

export const sql = <T = unknown>(
  strings: TemplateStringsArray,
  ...values: unknown[]
) => {
  // log.info(format(strings, ...values));
  return query<T>(SqlString.format(strings.join("?"), values));
};
