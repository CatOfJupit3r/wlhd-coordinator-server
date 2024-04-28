import { NextFunction, Request, Response } from 'express'
import { CriticalError, Exception } from '../models/ErrorModels'

export const errorHandlerMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.log(err instanceof Exception, err instanceof CriticalError)
    if (err instanceof Exception) {
        res.status(err.status).json({ message: err.message, ...err.additionalData })
        if (err instanceof CriticalError) process.exit(1)
    } else {
        console.log('Caught undocumented error:', err)
        res.status(500).json({ message: 'Internal server error' })
        next(err)
    }
}
