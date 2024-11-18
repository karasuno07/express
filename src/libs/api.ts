import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { JwtPayload, TokenExpiredError, verify } from 'jsonwebtoken';
import { HttpError } from '../types';

export async function validationHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const errorResults = validationResult(req);
  if (errorResults.isEmpty()) {
    return next();
  }

  const errors = errorResults
    .formatWith((err: any) => {
      return {
        field: err.path,
        message: err.msg,
      };
    })
    .array();

  const error = {
    name: 'Validation Error',
    message: errors[0].message,
  };
  console.error('Validation Error:', errors[0].message);

  return res.status(400).json({ error });
}

export function logger(req: Request, res: Response, next: NextFunction) {
  console.log(`Request ${req.method.toUpperCase()} ${req.url} has been called`);
  next();
}

export async function jwtInterceptor(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { url, headers } = req;
  const tokenPrefix = 'Bearer ';

  const publicRoutes = ['/', '/api-docs', '/api/authenticate', '/api/register'];

  const routePatterns = publicRoutes.map((route) => {
    if (route === '/') {
      return new RegExp('^\\/$');
    }
    return new RegExp(`^${route}(?:/.*)?$`);
  });

  const isPublicRoute = routePatterns.some((pattern) => pattern.test(url));
  if (!isPublicRoute) {
    const authorizationHeader = headers.authorization;

    if (!authorizationHeader) {
      console.error(
        `Request ${req.url} has been blocked by not providing sufficient authorization credentials`
      );
      res.status(403).json({
        error: {
          name: 'Access Denied',
          message: 'You do not have permisson to view/modify this resource',
        },
      });
    } else {
      const token = authorizationHeader.substring(tokenPrefix.length);
      try {
        const decoded = verify(token, process.env.ACCESS_TOKEN!) as JwtPayload;
        const username = decoded.username;
        console.log(
          `User ${username} has authenticated succesfully at ${new Date().toISOString()}`
        );
        next();
      } catch (err: unknown) {
        if (err instanceof TokenExpiredError) {
          res.status(401).json({ error: { ...err } });
        } else if (err instanceof Error) {
          res.status(400).json({
            error: {
              error: err.name,
              message: err.message,
            },
          });
        } else {
          res.status(500).json({
            error: {
              name: 'Internal Server Error',
            },
          });
        }
      }
    }
  } else {
    next();
  }
}

export async function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err);
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: {
        name: err.name,
        message: err.message,
      },
    });
  } else if (err instanceof Error) {
    res.status(500).json({
      error: {
        name: err.name,
        message: err.message,
      },
    });
  }
}
