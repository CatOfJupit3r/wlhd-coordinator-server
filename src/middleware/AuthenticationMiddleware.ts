import { Request, Response, NextFunction } from 'express';

export function authenticationMiddleware(req: Request, res: Response, next: NextFunction): void {
    // if (userAuthenticated) {
    //     next();
    // } else {
    //     res.status(401).send('Unauthorized');
    // }
    next();
}
