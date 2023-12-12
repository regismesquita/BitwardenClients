import { PrfKey } from "../../../platform/models/domain/symmetric-crypto-key";

/**
 * Contains methods for all crypto operations specific to the WebAuthn login flow.
 */
export abstract class WebAuthnLoginPrfCryptoServiceAbstraction {
  /**
   * Get the salt used to generate the PRF-output used when logging in with WebAuthn.
   */
  getLoginWithPrfSalt: () => Promise<ArrayBuffer>;

  /**
   * Create a symmetric key from the PRF-output by stretching it.
   * This should be used as `ExternalKey` with `RotateableKeySet`.
   */
  createSymmetricKeyFromPrf: (prf: ArrayBuffer) => Promise<PrfKey>;
}
