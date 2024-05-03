import { NextFunction, Request, Response } from 'express'
import { CriticalError, Exception } from '../models/ErrorModels'

export const errorHandlerMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof Exception) {
        res.status(err.status).json({ message: err.message, ...err.additionalData })
        if (err instanceof CriticalError) process.exit(1)
    } else {
        // If clients sends bad JSON, express json lib will throw SyntaxError
        // We can catch it and send a proper response
        if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
            return res.status(400).send({ status: 400, message: err.message })
        }
        console.log('Caught undocumented error:', err)
        res.status(500).json({ message: 'Internal server error' })
        next(err)
    }
}
