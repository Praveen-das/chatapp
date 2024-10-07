export interface IUser {
  id: string;
  username: string;
  bio: string;
  profilePicture: string;
  rules?: IUserRules;
  status?: "online" | "offline";
  lastSeen: number;
  createdAt: number;
  updatedAt: number;
  self?: boolean;
}


export interface IBlocked {
  id: string;
  user: IUser;
  blockedUser: IUser;
}
