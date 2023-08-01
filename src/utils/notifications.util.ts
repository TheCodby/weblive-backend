import { Injectable } from '@nestjs/common';
import { INotif } from '../interfaces/notification';
import { RedisCache } from './cache.util';

@Injectable()
export class NotificationsUtil {
  constructor(private readonly cache: RedisCache) {}
  async pushNotification(userId: number, notification: INotif) {
    // TODO: Push notification to redis
    try {
      const cachedNotifs = (await this.getNotifications(userId)) || [];
      await this.cache.setCache(`${userId}:notifications`, [
        ...cachedNotifs,
        notification,
      ]);
    } catch (err) {
      console.log(err);
    }
  }
  async clearNotifications(userId: number) {
    try {
      await this.cache.setCache(`${userId}:notifications`, []);
    } catch (err) {
      console.log(err);
    }
  }

  // async pushNotificationToAll(notification: INotif) {
  //
  // }
  async pushNotificationToMany(userIds: number[], notification: INotif[]) {
    try {
      if (userIds.length !== notification.length) {
        throw new Error('User ids and notifications length must be equal');
      }
      for (const userId of userIds) {
        this.cache.setCache(`${userId}:notifications}`, notification);
      }
    } catch (err) {
      console.log(err);
    }
  }
  async getNotifications(userId: number) {
    try {
      return this.cache.getCache(`${userId}:notifications`) || [];
    } catch (err) {
      console.log(err);
    }
  }
}
