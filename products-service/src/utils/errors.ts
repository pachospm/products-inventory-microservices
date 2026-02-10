export class AppError extends Error {
  constructor(
    public statusCode: number,
    public title: string,
    message: string,
    public detail?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, 'Not Found', `${resource} with id '${id}' not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'Conflict', message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(422, 'Unprocessable Entity', message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Invalid or missing API key') {
    super(401, 'Unauthorized', message);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(503, 'Service Unavailable', `${service} is currently unavailable`);
  }
}

export class GatewayTimeoutError extends AppError {
  constructor(service: string) {
    super(504, 'Gateway Timeout', `${service} did not respond in time`);
  }
}
