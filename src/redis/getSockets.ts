import { RedisClient } from "..";

export const getSocketsFromRedis = async (recipientId: string) => {
  try {
    
    const recipient = await RedisClient.get(`ID:${recipientId}`);
    if(!recipient){
      console.log('recipient doesnt exist');
    }else{
      return recipient
    }
  } catch (error: any) {
    console.log(error.message);
  }
};
