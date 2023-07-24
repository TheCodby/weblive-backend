export interface IOauthProvider {
  login(code: string): Promise<any>;
  getAccessToken(code: string): Promise<string>;
  profile(accessToken: string): Promise<any>;
  createAccount(profile: any): Promise<any>;
}
