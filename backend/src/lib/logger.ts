type Level = 'debug' | 'info' | 'warn' | 'error';

function emit(level: Level, msg: string, meta?: unknown): void {
  const entry = {
    t: new Date().toISOString(),
    level,
    msg,
    ...(meta !== undefined ? { meta } : {}),
  };
  const line = JSON.stringify(entry);
  // eslint-disable-next-line no-console
  if (level === 'error') console.error(line);
  // eslint-disable-next-line no-console
  else if (level === 'warn') console.warn(line);
  // eslint-disable-next-line no-console
  else console.log(line);
}

export const logger = {
  info: (msg: string, meta?: unknown) => emit('info', msg, meta),
  warn: (msg: string, meta?: unknown) => emit('warn', msg, meta),
  error: (msg: string, meta?: unknown) => emit('error', msg, meta),
  debug: (msg: string, meta?: unknown) => {
    if (process.env.NODE_ENV !== 'production') emit('debug', msg, meta);
  },
};
