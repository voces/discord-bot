export const query = <T = unknown>(query: string): Promise<T> =>
  fetch("https://w3x.io/sql", {
    headers: {
      "x-dbproxy-user": "elopublic",
      "x-dbproxy-password": Deno.env.get("SQL_PASSWORD")!,
      "x-dbproxy-database": "elo",
    },
    method: "POST",
    body: query,
  }).then((r) => r.json());
