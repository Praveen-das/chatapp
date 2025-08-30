export interface ISession {
  userId: string;
  sessionId: string;
  data: {
    browser: string;
    os: string;
    device: string;
    city: string;
    timestamp: number;
  };
  self?: boolean;
  expired?: boolean;
}
