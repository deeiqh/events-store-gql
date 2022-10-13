import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const GetUser = createParamDecorator(
  (_data, ctx: ExecutionContext): string => {
    const gqlCtx = GqlExecutionContext.create(ctx).getContext();
    return gqlCtx.req.user;
  },
);
