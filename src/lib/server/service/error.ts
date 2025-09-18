export type ErrorDetails = Record<string, unknown> | undefined;

export class AppError extends Error {
	readonly status: number;
	readonly code: string;
	readonly details: ErrorDetails;

	constructor(message: string, status: number, code: string, details?: ErrorDetails) {
		super(message);
		this.name = new.target.name;
		this.status = status;
		this.code = code;
		this.details = details;
	}
}

export class InternalServerError extends AppError {
	constructor(message = 'Internal server error', details?: ErrorDetails) {
		super(message, 500, 'INTERNAL_SERVER_ERROR', details);
	}
}

export class BadRequestError extends AppError {
	constructor(message = 'Bad request', details?: ErrorDetails) {
		super(message, 400, 'BAD_REQUEST', details);
	}
}

export class NotFoundError extends AppError {
	constructor(message = 'Not found', details?: ErrorDetails) {
		super(message, 404, 'NOT_FOUND', details);
	}
}

export class ConflictError extends AppError {
	constructor(message = 'Conflict', details?: ErrorDetails) {
		super(message, 409, 'CONFLICT', details);
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = 'Unauthorized', details?: ErrorDetails) {
		super(message, 401, 'UNAUTHORIZED', details);
	}
}

export class ForbiddenError extends AppError {
	constructor(message = 'Forbidden', details?: ErrorDetails) {
		super(message, 403, 'FORBIDDEN', details);
	}
}

export class UnprocessableEntityError extends AppError {
	constructor(message = 'Unprocessable entity', details?: ErrorDetails) {
		super(message, 422, 'UNPROCESSABLE_ENTITY', details);
	}
}

export function isAppError(err: unknown): err is AppError {
	return err instanceof AppError;
}
