export interface OauthProvider {
  login(code: string): Promise<any>;
}
