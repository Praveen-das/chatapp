export interface IUser {
  id: string;
  username: string;
  phonenumber: string;
  bio: string;
  tags: string[];
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
