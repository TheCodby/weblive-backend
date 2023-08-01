export interface INotif {
  id: number;
  type: string;
  message: string;
  read: boolean;
  createdAt: Date;
  url?: string;
}
