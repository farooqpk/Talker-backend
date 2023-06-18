import { RedisClient } from "../index";

export const getTempCachedUserData = async (subId: string) => {
  try {
    const cachedData = await RedisClient.get(subId);
    if (cachedData) {
      return JSON.parse(cachedData);
    } else {
      console.log("no temp data");
    }
  } catch (error) {
    console.log(`error occured while fetching cache data: ${error}`);
  }
};
