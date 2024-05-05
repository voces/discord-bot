import { STATUS_CODE } from "@std/http/status";

export const validateRequest = (
  request: Request,
  schema: { [method: string]: { headers: string[] } | undefined },
) => {
  const requestSchema = schema[request.method];
  if (!requestSchema) {
    return Response.json(
      { error: `method '${request.method}' is not allowd` },
      { status: STATUS_CODE.MethodNotAllowed },
    );
  }

  const missingHeaders = requestSchema.headers
    .filter((h) => !request.headers.has(h));
  if (missingHeaders.length) {
    return Response.json({
      error: `header '${missingHeaders[0]}' not available`,
    }, { status: STATUS_CODE.BadRequest });
  }
};
