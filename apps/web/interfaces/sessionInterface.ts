import { IUser } from "./userInterface";

export interface ISession {
  userId: string;
  sessionId: string;
  data:{
    userData: IUser;
    deviceData: {
      browser: string;
      os: string;
      device: string;
      city: string;
      timestamp: number;
    };
  }
  self?: boolean;
  expired?: boolean;
}

export interface ISessionBody{
  userId:string
  sessionId:string
  token:string
}
