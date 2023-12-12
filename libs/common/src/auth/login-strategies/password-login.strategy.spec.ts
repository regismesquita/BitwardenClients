import { mock, MockProxy } from "jest-mock-extended";

import { ApiService } from "../../abstractions/api.service";
import { PolicyService } from "../../admin-console/abstractions/policy/policy.service.abstraction";
import { AppIdService } from "../../platform/abstractions/app-id.service";
import { CryptoService } from "../../platform/abstractions/crypto.service";
import { LogService } from "../../platform/abstractions/log.service";
import { MessagingService } from "../../platform/abstractions/messaging.service";
import { PlatformUtilsService } from "../../platform/abstractions/platform-utils.service";
import { StateService } from "../../platform/abstractions/state.service";
import { HashPurpose } from "../../platform/enums";
import { Utils } from "../../platform/misc/utils";
import {
  MasterKey,
  SymmetricCryptoKey,
  UserKey,
} from "../../platform/models/domain/symmetric-crypto-key";
import {
  PasswordStrengthService,
  PasswordStrengthServiceAbstraction,
} from "../../tools/password-strength";
import { CsprngArray } from "../../types/csprng";
import { AuthService } from "../abstractions/auth.service";
import { TokenService } from "../abstractions/token.service";
import { TwoFactorService } from "../abstractions/two-factor.service";
import { TwoFactorProviderType } from "../enums/two-factor-provider-type";
import { ForceSetPasswordReason } from "../models/domain/force-set-password-reason";
import { PasswordLoginCredentials } from "../models/domain/login-credentials";
import { IdentityTokenResponse } from "../models/response/identity-token.response";
import { IdentityTwoFactorResponse } from "../models/response/identity-two-factor.response";
import { MasterPasswordPolicyResponse } from "../models/response/master-password-policy.response";

import { identityTokenResponseFactory } from "./login.strategy.spec";
import { PasswordLoginStrategy } from "./password-login.strategy";

const email = "hello@world.com";
const masterPassword = "password";
const hashedPassword = "HASHED_PASSWORD";
const localHashedPassword = "LOCAL_HASHED_PASSWORD";
const masterKey = new SymmetricCryptoKey(
  Utils.fromB64ToArray(
    "N2KWjlLpfi5uHjv+YcfUKIpZ1l+W+6HRensmIqD+BFYBf6N/dvFpJfWwYnVBdgFCK2tJTAIMLhqzIQQEUmGFgg=="
  )
) as MasterKey;
const deviceId = Utils.newGuid();
const masterPasswordPolicy = new MasterPasswordPolicyResponse({
  EnforceOnLogin: true,
  MinLength: 8,
});

describe("PasswordLoginStrategy", () => {
  let cryptoService: MockProxy<CryptoService>;
  let apiService: MockProxy<ApiService>;
  let tokenService: MockProxy<TokenService>;
  let appIdService: MockProxy<AppIdService>;
  let platformUtilsService: MockProxy<PlatformUtilsService>;
  let messagingService: MockProxy<MessagingService>;
  let logService: MockProxy<LogService>;
  let stateService: MockProxy<StateService>;
  let twoFactorService: MockProxy<TwoFactorService>;
  let authService: MockProxy<AuthService>;
  let policyService: MockProxy<PolicyService>;
  let passwordStrengthService: MockProxy<PasswordStrengthServiceAbstraction>;

  let passwordLoginStrategy: PasswordLoginStrategy;
  let credentials: PasswordLoginCredentials;
  let tokenResponse: IdentityTokenResponse;

  beforeEach(async () => {
    cryptoService = mock<CryptoService>();
    apiService = mock<ApiService>();
    tokenService = mock<TokenService>();
    appIdService = mock<AppIdService>();
    platformUtilsService = mock<PlatformUtilsService>();
    messagingService = mock<MessagingService>();
    logService = mock<LogService>();
    stateService = mock<StateService>();
    twoFactorService = mock<TwoFactorService>();
    authService = mock<AuthService>();
    policyService = mock<PolicyService>();
    passwordStrengthService = mock<PasswordStrengthService>();

    appIdService.getAppId.mockResolvedValue(deviceId);
    tokenService.decodeToken.mockResolvedValue({});

    authService.makePreloginKey.mockResolvedValue(masterKey);

    cryptoService.hashMasterKey
      .calledWith(masterPassword, expect.anything(), undefined)
      .mockResolvedValue(hashedPassword);
    cryptoService.hashMasterKey
      .calledWith(masterPassword, expect.anything(), HashPurpose.LocalAuthorization)
      .mockResolvedValue(localHashedPassword);

    policyService.evaluateMasterPassword.mockReturnValue(true);

    passwordLoginStrategy = new PasswordLoginStrategy(
      cryptoService,
      apiService,
      tokenService,
      appIdService,
      platformUtilsService,
      messagingService,
      logService,
      stateService,
      twoFactorService,
      passwordStrengthService,
      policyService,
      authService
    );
    credentials = new PasswordLoginCredentials(email, masterPassword);
    tokenResponse = identityTokenResponseFactory(masterPasswordPolicy);

    apiService.postIdentityToken.mockResolvedValue(tokenResponse);
  });

  it("sends master password credentials to the server", async () => {
    await passwordLoginStrategy.logIn(credentials);

    expect(apiService.postIdentityToken).toHaveBeenCalledWith(
      expect.objectContaining({
        email: email,
        masterPasswordHash: hashedPassword,
        device: expect.objectContaining({
          identifier: deviceId,
        }),
        twoFactor: expect.objectContaining({
          provider: null,
          token: null,
        }),
        captchaResponse: undefined,
      })
    );
  });

  it("sets keys after a successful authentication", async () => {
    const userKey = new SymmetricCryptoKey(new Uint8Array(64).buffer as CsprngArray) as UserKey;

    cryptoService.getMasterKey.mockResolvedValue(masterKey);
    cryptoService.decryptUserKeyWithMasterKey.mockResolvedValue(userKey);

    await passwordLoginStrategy.logIn(credentials);

    expect(cryptoService.setMasterKey).toHaveBeenCalledWith(masterKey);
    expect(cryptoService.setMasterKeyHash).toHaveBeenCalledWith(localHashedPassword);
    expect(cryptoService.setMasterKeyEncryptedUserKey).toHaveBeenCalledWith(tokenResponse.key);
    expect(cryptoService.setUserKey).toHaveBeenCalledWith(userKey);
    expect(cryptoService.setPrivateKey).toHaveBeenCalledWith(tokenResponse.privateKey);
  });

  it("does not force the user to update their master password when there are no requirements", async () => {
    apiService.postIdentityToken.mockResolvedValueOnce(identityTokenResponseFactory());

    const result = await passwordLoginStrategy.logIn(credentials);

    expect(policyService.evaluateMasterPassword).not.toHaveBeenCalled();
    expect(result.forcePasswordReset).toEqual(ForceSetPasswordReason.None);
  });

  it("does not force the user to update their master password when it meets requirements", async () => {
    passwordStrengthService.getPasswordStrength.mockReturnValue({ score: 5 } as any);
    policyService.evaluateMasterPassword.mockReturnValue(true);

    const result = await passwordLoginStrategy.logIn(credentials);

    expect(policyService.evaluateMasterPassword).toHaveBeenCalled();
    expect(result.forcePasswordReset).toEqual(ForceSetPasswordReason.None);
  });

  it("forces the user to update their master password on successful login when it does not meet master password policy requirements", async () => {
    passwordStrengthService.getPasswordStrength.mockReturnValue({ score: 0 } as any);
    policyService.evaluateMasterPassword.mockReturnValue(false);

    const result = await passwordLoginStrategy.logIn(credentials);

    expect(policyService.evaluateMasterPassword).toHaveBeenCalled();
    expect(stateService.setForceSetPasswordReason).toHaveBeenCalledWith(
      ForceSetPasswordReason.WeakMasterPassword
    );
    expect(result.forcePasswordReset).toEqual(ForceSetPasswordReason.WeakMasterPassword);
  });

  it("forces the user to update their master password on successful 2FA login when it does not meet master password policy requirements", async () => {
    passwordStrengthService.getPasswordStrength.mockReturnValue({ score: 0 } as any);
    policyService.evaluateMasterPassword.mockReturnValue(false);

    const token2FAResponse = new IdentityTwoFactorResponse({
      TwoFactorProviders: ["0"],
      TwoFactorProviders2: { 0: null },
      error: "invalid_grant",
      error_description: "Two factor required.",
      MasterPasswordPolicy: masterPasswordPolicy,
    });

    // First login request fails requiring 2FA
    apiService.postIdentityToken.mockResolvedValueOnce(token2FAResponse);
    const firstResult = await passwordLoginStrategy.logIn(credentials);

    // Second login request succeeds
    apiService.postIdentityToken.mockResolvedValueOnce(
      identityTokenResponseFactory(masterPasswordPolicy)
    );
    const secondResult = await passwordLoginStrategy.logInTwoFactor(
      {
        provider: TwoFactorProviderType.Authenticator,
        token: "123456",
        remember: false,
      },
      ""
    );

    // First login attempt should not save the force password reset options
    expect(firstResult.forcePasswordReset).toEqual(ForceSetPasswordReason.None);

    // Second login attempt should save the force password reset options and return in result
    expect(stateService.setForceSetPasswordReason).toHaveBeenCalledWith(
      ForceSetPasswordReason.WeakMasterPassword
    );
    expect(secondResult.forcePasswordReset).toEqual(ForceSetPasswordReason.WeakMasterPassword);
  });
});
