
import { Request, Response, NextFunction } from 'express';

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';

    const log = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent']?.slice(0, 50),
    };

    if (logLevel === 'error') {
      console.error(JSON.stringify(log));
    } else if (process.env.NODE_ENV !== 'production' || duration > 1000) {
      console.log(JSON.stringify(log));
    }
  });

  next();
}
