type LogLevel = "info" | "warn" | "error";

type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | Serializable[]
  | { [key: string]: Serializable };

type LogContext = Record<string, Serializable>;

type RequestLogContext = {
  requestId: string;
  route: string;
  method?: string;
  path?: string;
  vercelEnv?: string;
  vercelRegion?: string;
  vercelDeploymentId?: string;
  ip?: string;
  userAgent?: string;
} & LogContext;

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return {
    message: typeof error === "string" ? error : "Unknown error",
    value: safeValue(error)
  };
}

function safeValue(value: unknown): Serializable {
  if (
    value == null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => safeValue(item));
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
      key,
      safeValue(nestedValue)
    ]);
    return Object.fromEntries(entries);
  }

  return String(value);
}

function writeLog(level: LogLevel, event: string, context: LogContext) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context
  };
  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
}

export function createRequestLogContext(
  request: Request,
  route: string,
  extras: LogContext = {}
): RequestLogContext {
  const url = new URL(request.url);

  return {
    requestId: crypto.randomUUID(),
    route,
    method: request.method,
    path: url.pathname,
    vercelEnv: process.env.VERCEL_ENV,
    vercelRegion: process.env.VERCEL_REGION,
    vercelDeploymentId: process.env.VERCEL_DEPLOYMENT_ID,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent: request.headers.get("user-agent") ?? undefined,
    ...extras
  };
}

export function logInfo(event: string, context: LogContext) {
  writeLog("info", event, context);
}

export function logWarn(event: string, context: LogContext) {
  writeLog("warn", event, context);
}

export function logError(event: string, context: LogContext) {
  writeLog("error", event, context);
}

export function logRouteError(
  event: string,
  context: RequestLogContext,
  error: unknown,
  extras: LogContext = {}
) {
  logError(event, {
    ...context,
    ...extras,
    error: serializeError(error)
  });
}

export function messageFromError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
