import CryptoJS from 'crypto-js';

const sharedKey = "obvwoqcbv21801f19d0zibcoavwpnq";

export const encrypt = (message:string) => {
  const encrypted = CryptoJS.AES.encrypt(message, sharedKey).toString();
  return encrypted;
};

export const decrypt = (encryptedMessage:string) => {
  const bytes = CryptoJS.AES.decrypt(encryptedMessage, sharedKey);
  const originalMessage = bytes.toString(CryptoJS.enc.Utf8);
  return originalMessage;
};