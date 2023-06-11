import axios, { AxiosResponse } from "axios";

interface UserData {
  sub: string;
  name: string;
  picture: string;
  email: string;
}

export const fetchFromAccessToken = async (accessToken: string) => {

  const response: AxiosResponse = await axios.get(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: accessToken
      },
    }
  );
  const userData: UserData = {
    sub: response.data.sub,
    name: response.data.name,
    email: response.data.email,
    picture: response.data.picture,
  };
  return userData;
};
