import { Namespace } from "socket.io";
import { ISocket } from "../interfaces/socketInterfaces";

export default function registerOTPHandler(io: Namespace, socket: ISocket) {
  socket.on("OTP_REQUEST", async ({ userId }: { userId: string }, callback) => {
    console.log({ userId });
    io.to(userId).emit("OTP_MESSAGE", { otp: 121212 });
    callback();
  });
}
