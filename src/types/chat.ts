export type EncryptedChatKey = {
  encryptedChatKey: Array<{
    userId: string;
    encryptedKey: string;
  }>;
};
