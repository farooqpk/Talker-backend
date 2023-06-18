import { RedisClient } from "../index";
import {AccesTokenData} from '../types/UserData'


export const cacheUserDataTemporary = async (accesedData: AccesTokenData) => {
  try {
    await RedisClient.setEx(
      accesedData.sub,
      600, // Expiration time in seconds
      JSON.stringify(accesedData)
    );
    return;
  } catch (error) {
    console.log("Error occurred while caching user data:", error);
  }
};
