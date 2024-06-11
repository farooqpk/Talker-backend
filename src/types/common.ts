export type EncryptedChatKey = {
  encryptedChatKey: Array<{
    userId: string;
    encryptedKey: string;
  }>;
};

export enum ContentType {
  TEXT = "TEXT",
  AUDIO = "AUDIO",
  IMAGE = "IMAGE",
}


