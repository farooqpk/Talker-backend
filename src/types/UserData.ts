

export interface AccesTokenData {
  sub: string;
  picture: string;
  email: string;
}

export interface UserType {
  sub: string;
  name: string;
  email: string;
  picture: string;
}

export interface JwtDecodedType {
  userId: string;
  iat: number;
  exp: number;
}