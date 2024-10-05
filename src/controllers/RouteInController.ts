import { Request, Response, Router } from 'express'
import { z } from 'zod'

type QueryZod = z.ZodObject<any, any> | z.ZodRecord | z.ZodEffects<any>
type BodyZod = z.ZodObject<any, any> | z.ZodRecord | z.ZodEffects<any>
type ParamsZod = z.ZodObject<any, any> | z.ZodRecord | z.ZodEffects<any>
type RouteZodType = {
    body?: BodyZod
    params?: ParamsZod
    query?: QueryZod
}

export interface RouteInControllerOptions extends RouteZodType {}

type RouteExecutorType = (req: Request, res: Response) => Promise<void> | void

export type RouteConfig = {
    type: 'get' | 'post' | 'put' | 'delete' | 'patch'
    path: string
    route: RouteInControllerClass
    middleware?: any[]
}

class RouteInControllerClass {
    public execute: RouteExecutorType
    public zod: RouteZodType

    constructor(execute: RouteExecutorType, options: RouteInControllerOptions = {}) {
        this.execute = execute
        this.zod = {
            body: options?.body,
            params: options?.params,
            query: options?.query,
        }
    }

    public parseZod = (req: Request) => {
        if (this.zod?.body) this.zod.body.parse(req.body)
        if (this.zod?.params) this.zod.params.parse(req.params)
        if (this.zod?.query) this.zod.query.parse(req.query)
    }
}

export const createRouteInController = (execute: RouteExecutorType, options: RouteInControllerOptions = {}) => {
    return new RouteInControllerClass(execute, options)
}

export const createConfig = (
    type: 'get' | 'post' | 'put' | 'delete' | 'patch',
    path: string,
    route: RouteInControllerClass | RouteExecutorType,
    middleware?: any[]
) => {
    if (route instanceof RouteInControllerClass) return { type, path, route, middleware }
    else return { type, path, route: new RouteInControllerClass(route), middleware }
}

const createHandler = (route: RouteInControllerClass) => {
    return async (req: Request, res: Response) => {
        // errors are handled by the global error handler
        route.parseZod(req)
        await route.execute(req, res)
    }
}

const buildRoute = (router: Router, config: RouteConfig) => {
    const { type, path, route, middleware } = config
    const func = createHandler(route)
    if (middleware) router[type](path, ...middleware, func)
    else router[type](path, func)
}

export const createRouter = (config: RouteConfig[], middleware?: any[]): Router => {
    const router = Router()

    if (middleware) router.use(...middleware)

    config.forEach((routeConfig) => buildRoute(router, routeConfig))
    return router
}
