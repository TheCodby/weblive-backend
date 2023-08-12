import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      console.error(error);
    }
  }
  exclude<User, Key extends keyof User>(
    user: User,
    keys: Key[],
  ): Omit<User, Key> {
    const filteredEntries = Object.entries(user).filter(
      ([key]) => !keys.includes(key as Key),
    );
    const filteredObject: Partial<User> = {};
    for (const [key, value] of filteredEntries) {
      filteredObject[key as keyof User] = value;
    }
    return filteredObject as Omit<User, Key>;
  }
  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
