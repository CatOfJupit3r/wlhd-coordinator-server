import { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { CriticalError, Exception } from '../models/ErrorModels'

export const errorHandlerMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof Exception) {
        res.status(err.status).json({ message: err.message, ...err.additionalData })
        if (err instanceof CriticalError) process.exit(1)
    } else if (err instanceof ZodError) {
        // if during validation of request body, zod throws an error, we can catch it and send a proper response
        // this way we can catch all validation errors in one place
        res.status(400).send({ status: 400, message: err.errors })
        return
    } else {
        // If clients sends bad JSON, express json lib will throw SyntaxError
        // We can catch it and send a proper response
        if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
            res.status(400).send({ status: 400, message: err.message })
            return
        }
        console.log('Caught undocumented error:', err)
        res.status(500).json({ message: 'Internal server error' })
        next(err)
    }
}
