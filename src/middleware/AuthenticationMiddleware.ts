import { NextFunction, Request, Response } from 'express'

export function authenticationMiddleware(req: Request, res: Response, next: NextFunction) {
    console.log(req.headers)
    next()
    // try {
    //     if (!req.headers || !req.headers.authorization) {
    //         return res.status(401).json({
    //             message: "Authentification Failed"
    //         });
    //     }
    //     const token = req.headers.authorization.replace("Bearer ", "");
    //     const decoded = verify(token, JWT_SECRET);
    //
    //     req.userData = decoded;
    //     next();
    // } catch (err) {
    //     return res.status(401).json({
    //         message: "Authentification Failed"
    //     });
    // }
}

export const verifyToken = (token: string, expectedUser: string) => {
    // try {
    //     const decoded = verify(token, JWT_SECRET);
    //     return decoded.user === expectedUser;
    // } catch (err) {
    //     return null;
    // }
}
