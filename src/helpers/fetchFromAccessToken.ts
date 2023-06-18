import axios, { AxiosResponse } from "axios";
import {AccesTokenData} from '../types/UserData'


export const fetchFromAccessToken = async (accessToken: string) => {

  const response: AxiosResponse = await axios.get(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    { 
      headers: {
        Authorization: accessToken
      },
    }
  ); 
  const userData: AccesTokenData = {
    sub: response.data.sub,
    email: response.data.email,
    picture: response.data.picture,
  };
  return userData;
};
