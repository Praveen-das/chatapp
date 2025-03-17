interface ISession {
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
}
