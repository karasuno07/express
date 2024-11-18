type Enumerate<
  N extends number,
  Acc extends number[] = []
> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>;
type IntRange<F extends number, T extends number> = Exclude<
  Enumerate<T>,
  Enumerate<F>
>;
type ErrorPayload = {
  status: number;
  name: string;
  message: string;
  errors?: unknown[];
};

type ClientErrorPayLoad = Omit<ErrorPayload, 'status'> & {
  status: IntRange<400, 499>;
};
type ServerErrorPayload = Omit<ErrorPayload, 'status'> & {
  status: IntRange<500, 599>;
};

export class HttpError extends Error {
  status: number;
  errors?: unknown[];

  constructor({ status, name, message, errors }: ErrorPayload) {
    super(message);
    this.status = status;
    this.name = name;
    this.errors = errors;
  }
}

export class HttpClientError extends HttpError {
  constructor({
    status = 400,
    name = 'Bad Client',
    message,
    errors,
  }: ClientErrorPayLoad) {
    super({ status, name, message, errors });
  }

  static badClient(message: string) {
    return new HttpClientError({ status: 400, name: 'Bad Client', message });
  }

  static unauthorized(message: string) {
    return new HttpClientError({ status: 401, name: 'Unauthorized', message });
  }

  static accessDenied = new HttpClientError({
    status: 403,
    name: 'Access Denied',
    message: 'You do not have permission to access/modify this resource',
  });

  static notFound(message: string) {
    return new HttpClientError({
      status: 404,
      name: 'Resource Not Found',
      message,
    });
  }
}

export class HttpServerError extends HttpError {
  constructor({
    status = 500,
    name = 'Internal Server Error',
    message,
    errors,
  }: ServerErrorPayload) {
    super({ status, name, message, errors });
  }

  static internalServerError(message: string) {
    return new HttpServerError({
      status: 500,
      name: 'Internal Server Error',
      message,
    });
  }
}
