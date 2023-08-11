export interface IOauthProvider {
  getUser(code: string, redirectUri: string, userId?: number): Promise<any>;
  getAccessToken(code: string, redirectUri: string): Promise<string>;
  profile(accessToken: string): Promise<any>;
}
