import CryptoJS from 'crypto-js';

const SHARED_KEY = process.env.NEXT_PUBLIC_SHARED_KEY!;

export const encrypt = (message:string) => {
  const encrypted = CryptoJS.AES.encrypt(message, SHARED_KEY).toString();
  return encrypted;
};

export const decrypt = (encryptedMessage:string) => {
  if(process.env.NEXT_PUBLIC_CLIENT_ONLY) return encryptedMessage;

  const bytes = CryptoJS.AES.decrypt(encryptedMessage, SHARED_KEY);
  const originalMessage = bytes.toString(CryptoJS.enc.Utf8);
  return originalMessage;
};