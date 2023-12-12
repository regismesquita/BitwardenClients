import { ApiService } from "../../abstractions/api.service";
import { AppIdService } from "../../platform/abstractions/app-id.service";
import { CryptoService } from "../../platform/abstractions/crypto.service";
import { LogService } from "../../platform/abstractions/log.service";
import { MessagingService } from "../../platform/abstractions/messaging.service";
import { PlatformUtilsService } from "../../platform/abstractions/platform-utils.service";
import { StateService } from "../../platform/abstractions/state.service";
import { DeviceTrustCryptoServiceAbstraction } from "../abstractions/device-trust-crypto.service.abstraction";
import { TokenService } from "../abstractions/token.service";
import { TwoFactorService } from "../abstractions/two-factor.service";
import { AuthResult } from "../models/domain/auth-result";
import { AuthRequestLoginCredentials } from "../models/domain/login-credentials";
import { PasswordTokenRequest } from "../models/request/identity-token/password-token.request";
import { TokenTwoFactorRequest } from "../models/request/identity-token/token-two-factor.request";
import { IdentityTokenResponse } from "../models/response/identity-token.response";

import { LoginStrategy } from "./login.strategy";

export class AuthRequestLoginStrategy extends LoginStrategy {
  get email() {
    return this.tokenRequest.email;
  }

  get accessCode() {
    return this.authRequestCredentials.accessCode;
  }

  get authRequestId() {
    return this.authRequestCredentials.authRequestId;
  }

  tokenRequest: PasswordTokenRequest;
  private authRequestCredentials: AuthRequestLoginCredentials;

  constructor(
    cryptoService: CryptoService,
    apiService: ApiService,
    tokenService: TokenService,
    appIdService: AppIdService,
    platformUtilsService: PlatformUtilsService,
    messagingService: MessagingService,
    logService: LogService,
    stateService: StateService,
    twoFactorService: TwoFactorService,
    private deviceTrustCryptoService: DeviceTrustCryptoServiceAbstraction
  ) {
    super(
      cryptoService,
      apiService,
      tokenService,
      appIdService,
      platformUtilsService,
      messagingService,
      logService,
      stateService,
      twoFactorService
    );
  }

  override async logIn(credentials: AuthRequestLoginCredentials) {
    // NOTE: To avoid DeadObject references on Firefox, do not set the credentials object directly
    // Use deep copy in future if objects are added that were created in popup
    this.authRequestCredentials = { ...credentials };

    this.tokenRequest = new PasswordTokenRequest(
      credentials.email,
      credentials.accessCode,
      null,
      await this.buildTwoFactor(credentials.twoFactor),
      await this.buildDeviceRequest()
    );

    this.tokenRequest.setAuthRequestAccessCode(credentials.authRequestId);
    const [authResult] = await this.startLogIn();
    return authResult;
  }

  override async logInTwoFactor(
    twoFactor: TokenTwoFactorRequest,
    captchaResponse: string
  ): Promise<AuthResult> {
    this.tokenRequest.captchaResponse = captchaResponse ?? this.captchaBypassToken;
    return super.logInTwoFactor(twoFactor);
  }

  protected override async setMasterKey(response: IdentityTokenResponse) {
    if (
      this.authRequestCredentials.decryptedMasterKey &&
      this.authRequestCredentials.decryptedMasterKeyHash
    ) {
      await this.cryptoService.setMasterKey(this.authRequestCredentials.decryptedMasterKey);
      await this.cryptoService.setMasterKeyHash(this.authRequestCredentials.decryptedMasterKeyHash);
    }
  }

  protected override async setUserKey(response: IdentityTokenResponse): Promise<void> {
    // User now may or may not have a master password
    // but set the master key encrypted user key if it exists regardless
    await this.cryptoService.setMasterKeyEncryptedUserKey(response.key);

    if (this.authRequestCredentials.decryptedUserKey) {
      await this.cryptoService.setUserKey(this.authRequestCredentials.decryptedUserKey);
    } else {
      await this.trySetUserKeyWithMasterKey();
      // Establish trust if required after setting user key
      await this.deviceTrustCryptoService.trustDeviceIfRequired();
    }
  }

  private async trySetUserKeyWithMasterKey(): Promise<void> {
    const masterKey = await this.cryptoService.getMasterKey();
    if (masterKey) {
      const userKey = await this.cryptoService.decryptUserKeyWithMasterKey(masterKey);
      await this.cryptoService.setUserKey(userKey);
    }
  }

  protected override async setPrivateKey(response: IdentityTokenResponse): Promise<void> {
    await this.cryptoService.setPrivateKey(
      response.privateKey ?? (await this.createKeyPairForOldAccount())
    );
  }
}
