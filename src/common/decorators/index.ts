import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ClientIp = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = ctx.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return (
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      request.socket.remoteAddress ||
      'unknown'
    );
  },
);

export const ProcessingTime = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = ctx.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
    return request['startTime'];
  },
);
