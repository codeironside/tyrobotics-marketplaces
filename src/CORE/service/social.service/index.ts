import axios from "axios";
import { Types } from "mongoose";
import { AppError } from "../../utils/errorhandler";
import { config } from "../../utils/config";
type SocialProfile = {
  provider: string;
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photo: string;
  emailVerified: boolean;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
};
export class SocialAuthService {
  static async verifyGoogleToken(code: string): Promise<SocialProfile> {
    const params = new URLSearchParams();
    params.append("code", code);
    params.append("client_id", config.google.clientId);
    params.append("client_secret", config.google.clientSecret);
    params.append("redirect_uri", config.google.google_redirect_url);
    params.append("grant_type", "authorization_code");

    const tokenResponse = await axios.post(config.google.tokenUrl, params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const userResponse = await axios.get(config.google.userInfoUrl, {
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
    params.append("client_id", config.facebook.clientId);
    params.append("client_secret", config.facebook.clientSecret);
    params.append("redirect_uri", config.google.google_redirect_url);

    const tokenResponse = await axios.get(
      `${config.facebook.tokenUrl}?${params}`
    );

    const userResponse = await axios.get(config.facebook.userInfoUrl, {
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
    params.append("client_id", config.github.clientId);
    params.append("client_secret", config.github.clientSecret);
    params.append("redirect_uri", config.github.github_redirect_url);

    const tokenResponse = await axios.post(config.github.tokenUrl, params, {
      headers: { Accept: "application/json" },
    });

    const userResponse = await axios.get(config.github.userInfoUrl, {
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
        : new Date("2025-12-11T20:54:17.952+00:00"),
    };
  }

  // static async verifyLinkedInToken(code: string): Promise<ISocialProfile> {
  //   const params = new URLSearchParams();
  //   params.append("code", code);
  //   params.append("client_id", config.linkedin.clientId);
  //   params.append("client_secret", config.linkedin.clientSecret);
  //   params.append("redirect_uri", process.env.LINKEDIN_REDIRECT_URI);
  //   params.append("grant_type", "authorization_code");

  //   const tokenResponse = await axios.post(
  //     config.linkedin.tokenUrl,
  //     params,
  //     {
  //       headers: { "Content-Type": "application/x-www-form-urlencoded" },
  //     }
  //   );

  //   const userResponse = await axios.get(config.linkedin.userInfoUrl, {
  //     headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
  //   });

  //   return {
  //     provider: "linkedin",
  //     providerId: userResponse.data.sub,
  //     email: userResponse.data.email,
  //     firstName: userResponse.data.given_name,
  //     lastName: userResponse.data.family_name,
  //     displayName: userResponse.data.name,
  //     photo: userResponse.data.picture,
  //     emailVerified: userResponse.data.email_verified,
  //     accessToken: tokenResponse.data.access_token,
  //     refreshToken: tokenResponse.data.refresh_token,
  //     expiresAt: new Date(Date.now() + tokenResponse.data.expires_in * 1000),
  //   };
  // }

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
      // case "linkedin":
      //   return await this.verifyLinkedInToken(code);
      default:
        throw new AppError(400, `Unsupported provider: ${provider}`);
    }
  }
}
