import { Injectable } from '@nestjs/common';
import { INotif } from '../interfaces/notification';
import { RedisCache } from './cache.util';
import { Observer } from 'rxjs';

@Injectable()
export class NotificationsUtil {
  constructor(private readonly cache: RedisCache) {}
  // MAX NOTIFICATIONS PER USER
  private readonly MAX_NOTIFICATIONS = 50;
  private readonly NOTIFICATION_CLIENTS: Map<number, Observer<object>> =
    new Map();
  /**
   * Pushes a notification to a specific user's notification list in RedisCache.
   * @param userId The ID of the user.
   * @param notification The notification to be pushed.
   */
  async pushNotification(userId: number, notification: INotif): Promise<void> {
    try {
      const notifsNum = await this.getNotificationsNumber(userId);
      if (notifsNum >= this.MAX_NOTIFICATIONS)
        await this.cache.zremrangebyrank(
          `${userId}/notifications`,
          0,
          -this.MAX_NOTIFICATIONS,
        );
      await this.cache.zadd(
        `${userId}/notifications`,
        'NX',
        Date.now(),
        JSON.stringify(notification),
      );
      this.pushNotificationToClient(userId, notification);
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Clears all notifications for a specific user from RedisCache.
   * @param userId The ID of the user.
   */
  async clearNotifications(userId: number): Promise<void> {
    try {
      await this.cache.zremrangebyscore(
        `${userId}/notifications`,
        0,
        Date.now(),
      );
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Pushes a notification to multiple users' notification lists in RedisCache.
   * @param userIds The IDs of the users.
   * @param notifications The notifications to be pushed.
   */
  async pushNotificationToMany(
    userIds: number[],
    notification: INotif,
  ): Promise<void> {
    try {
      for (let i = 0; i < userIds.length; i++) {
        this.pushNotification(userIds[i], notification);
      }
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Retrieves the last 5 notifications for a specific user from RedisCache.
   * @param userId The ID of the user.
   * @returns An array of notifications.
   */
  async getNotifications(userId: number): Promise<INotif[]> {
    try {
      const notifications = await this.cache.zrange(
        `${userId}/notifications`,
        0,
        -1,
      );
      return notifications.map((notification) => JSON.parse(notification));
    } catch (err) {
      console.log(err);
      return [];
    }
  }
  async getNotificationsNumber(userId: number): Promise<number> {
    try {
      const notifications = await this.cache.zcount(
        `${userId}/notifications`,
        0,
        Date.now(),
      );
      return notifications;
    } catch (err) {
      console.log(err);
      return 0;
    }
  }
  getNotificationClients(): Observer<object>[] {
    const clients = Array.from(this.NOTIFICATION_CLIENTS.values());
    return clients;
  }
  addNotificationClient(userId: number, client: Observer<object>): void {
    this.NOTIFICATION_CLIENTS.set(userId, client);
  }
  removeNotificationClient(userId: number): void {
    this.NOTIFICATION_CLIENTS.delete(userId);
  }
  async getNotificationClient(userId: number): Promise<Observer<object>> {
    const client = this.NOTIFICATION_CLIENTS.get(userId);
    return client;
  }
  pushNotificationToClient(userId: number, notification: INotif): void {
    if (!this.NOTIFICATION_CLIENTS.has(userId)) return;
    const client = this.NOTIFICATION_CLIENTS.get(userId);
    client?.next({
      notifications: [notification],
    });
  }
}
