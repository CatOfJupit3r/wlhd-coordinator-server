export class Exception extends Error {
    constructor(
        public message: string,
        public status: number
    ) {
        super(message)
        this.status = status
    }
}

export class NotFound extends Exception {
    constructor(message: string = 'Data you are looking for was not found') {
        super(message, 404)
    }
}

export class Unauthorized extends Exception {
    constructor(message: string = 'Your request is not authorized') {
        super(message, 401)
    }
}

export class BadRequest extends Exception {
    constructor(message: string = 'Your request is malformed') {
        super(message, 400)
    }
}

export class InternalServerError extends Exception {
    constructor(message: string = 'Something went wrong on backend side') {
        super(message, 500)
    }
}

export class Forbidden extends Exception {
    constructor(message: string = 'You are not allowed to access this resource') {
        super(message, 403)
    }
}
