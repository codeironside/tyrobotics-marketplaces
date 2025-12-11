import axios from "axios";
import { Types } from "mongoose";
import { AppError } from "../../utils/errorhandler";
import { config } from "../../utils/config";
import { ISocialProfile } from "../../../API/AUTH/interface";
export class SocialAuthService {
  static async verifyGoogleToken(code: string): Promise<ISocialProfile> {
    const params = new URLSearchParams();
    params.append("code", code);
    params.append("client_id", socialConfig.google.clientId);
    params.append("client_secret", socialConfig.google.clientSecret);
    params.append("redirect_uri", process.env.GOOGLE_REDIRECT_URI);
    params.append("grant_type", "authorization_code");

    const tokenResponse = await axios.post(
      socialConfig.google.tokenUrl,
      params,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const userResponse = await axios.get(socialConfig.google.userInfoUrl, {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
    });

    return {
      provider: "google",
      providerId: userResponse.data.sub,
      email: userResponse.data.email,
      firstName: userResponse.data.given_name,
      lastName: userResponse.data.family_name,
      displayName: userResponse.data.name,
      photo: userResponse.data.picture,
      emailVerified: userResponse.data.email_verified,
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token,
      expiresAt: new Date(Date.now() + tokenResponse.data.expires_in * 1000),
    };
  }

  static async verifyFacebookToken(code: string): Promise<SocialProfile> {
    const params = new URLSearchParams();
    params.append("code", code);
    params.append("client_id", socialConfig.facebook.clientId);
    params.append("client_secret", socialConfig.facebook.clientSecret);
    params.append("redirect_uri", process.env.FACEBOOK_REDIRECT_URI);

    const tokenResponse = await axios.get(
      `${socialConfig.facebook.tokenUrl}?${params}`
    );

    const userResponse = await axios.get(socialConfig.facebook.userInfoUrl, {
      params: {
        fields: "id,name,email,first_name,last_name,picture",
        access_token: tokenResponse.data.access_token,
      },
    });

    return {
      provider: "facebook",
      providerId: userResponse.data.id,
      email: userResponse.data.email,
      firstName: userResponse.data.first_name,
      lastName: userResponse.data.last_name,
      displayName: userResponse.data.name,
      photo: userResponse.data.picture?.data?.url,
      emailVerified: true,
      accessToken: tokenResponse.data.access_token,
      expiresAt: new Date(Date.now() + tokenResponse.data.expires_in * 1000),
    };
  }

  static async verifyGithubToken(code: string): Promise<SocialProfile> {
    const params = new URLSearchParams();
    params.append("code", code);
    params.append("client_id", socialConfig.github.clientId);
    params.append("client_secret", socialConfig.github.clientSecret);
    params.append("redirect_uri", process.env.GITHUB_REDIRECT_URI);

    const tokenResponse = await axios.post(
      socialConfig.github.tokenUrl,
      params,
      {
        headers: { Accept: "application/json" },
      }
    );

    const userResponse = await axios.get(socialConfig.github.userInfoUrl, {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
    });

    const emailResponse = await axios.get(
      "https://api.github.com/user/emails",
      {
        headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
      }
    );

    const primaryEmail = emailResponse.data.find((email: any) => email.primary);

    return {
      provider: "github",
      providerId: userResponse.data.id.toString(),
      email: primaryEmail?.email || userResponse.data.email,
      displayName: userResponse.data.name || userResponse.data.login,
      photo: userResponse.data.avatar_url,
      emailVerified: primaryEmail?.verified || false,
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token,
      expiresAt: tokenResponse.data.expires_in
        ? new Date(Date.now() + tokenResponse.data.expires_in * 1000)
        : undefined,
    };
  }

  static async verifyLinkedInToken(code: string): Promise<SocialProfile> {
    const params = new URLSearchParams();
    params.append("code", code);
    params.append("client_id", socialConfig.linkedin.clientId);
    params.append("client_secret", socialConfig.linkedin.clientSecret);
    params.append("redirect_uri", process.env.LINKEDIN_REDIRECT_URI);
    params.append("grant_type", "authorization_code");

    const tokenResponse = await axios.post(
      socialConfig.linkedin.tokenUrl,
      params,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const userResponse = await axios.get(socialConfig.linkedin.userInfoUrl, {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
    });

    return {
      provider: "linkedin",
      providerId: userResponse.data.sub,
      email: userResponse.data.email,
      firstName: userResponse.data.given_name,
      lastName: userResponse.data.family_name,
      displayName: userResponse.data.name,
      photo: userResponse.data.picture,
      emailVerified: userResponse.data.email_verified,
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token,
      expiresAt: new Date(Date.now() + tokenResponse.data.expires_in * 1000),
    };
  }

  static async verifySocialToken(
    provider: string,
    code: string
  ): Promise<SocialProfile> {
    switch (provider) {
      case "google":
        return await this.verifyGoogleToken(code);
      case "facebook":
        return await this.verifyFacebookToken(code);
      case "github":
        return await this.verifyGithubToken(code);
      case "linkedin":
        return await this.verifyLinkedInToken(code);
      default:
        throw new AppError(400, `Unsupported provider: ${provider}`);
    }
  }
}
