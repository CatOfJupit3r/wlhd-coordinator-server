interface AdditionalData {
    [key: string]: any
}

export class Exception extends Error {
    constructor(
        public message: string,
        public status: number,
        public additionalData: AdditionalData = {}
    ) {
        super(message)
        this.status = status
        if (additionalData) {
            this.additionalData = additionalData
        }
    }
}

export class NotFound extends Exception {
    constructor(message: string = 'Data you are looking for was not found', additionalData?: AdditionalData) {
        super(message, 404, additionalData)
    }
}

export class Unauthorized extends Exception {
    constructor(message: string = 'Your request is not authorized', additionalData?: AdditionalData) {
        super(message, 401, additionalData)
    }
}

export class BadRequest extends Exception {
    constructor(message: string = 'Your request is malformed', additionalData?: AdditionalData) {
        super(message, 400, additionalData)
    }
}

export class InternalServerError extends Exception {
    constructor(message: string = 'Something went wrong on backend side', additionalData?: AdditionalData) {
        super(message, 500, additionalData)
    }
}

export class CriticalError extends Exception {
    constructor(message: string = 'Critical error occurred', additionalData?: AdditionalData) {
        super(message, 500, additionalData)
    }
}

export class Forbidden extends Exception {
    constructor(message: string = 'You are not allowed to access this resource', additionalData?: AdditionalData) {
        super(message, 403, additionalData)
    }
}

export class MethodNotAllowed extends Exception {
    constructor(message: string = 'This method is not allowed', additionalData?: AdditionalData) {
        super(message, 405, additionalData)
    }
}

export class Conflict extends Exception {
    constructor(message: string = 'Conflict occurred', additionalData?: AdditionalData) {
        super(message, 409, additionalData)
    }
}
