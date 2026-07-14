import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserActivityInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user && user.id) {
      const userId = user.id;
      const now = new Date();

      // Fire-and-forget: do not block the request thread
      // Only update database if the last activity was more than 1 minute ago to save performance
      this.prisma.user
        .findUnique({
          where: { id: userId },
          select: { lastActivityAt: true },
        })
        .then((dbUser) => {
          if (dbUser) {
            const lastActive = dbUser.lastActivityAt;
            if (!lastActive || now.getTime() - lastActive.getTime() > 60 * 1000) {
              this.prisma.user
                .update({
                  where: { id: userId },
                  data: { lastActivityAt: now },
                })
                .catch((err) =>
                  console.error('Failed to update user lastActivityAt:', err),
                );
            }
          }
        })
        .catch((err) =>
          console.error('Failed to query user lastActivityAt in interceptor:', err),
        );
    }

    return next.handle();
  }
}
