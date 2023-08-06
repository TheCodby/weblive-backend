export interface IOauthProvider {
  getUser(code: string): Promise<any>;
  getAccessToken(code: string): Promise<string>;
  profile(accessToken: string): Promise<any>;
}
