import {
  CreateCredentialResult,
  AssertCredentialResult,
} from "@bitwarden/common/vault/abstractions/fido2/fido2-client.service.abstraction";
import { Fido2Utils } from "@bitwarden/common/vault/services/fido2/fido2-utils";

import {
  InsecureAssertCredentialParams,
  InsecureCreateCredentialParams,
} from "./content/messaging/message";

export class WebauthnUtils {
  static mapCredentialCreationOptions(
    options: CredentialCreationOptions,
    fallbackSupported: boolean
  ): InsecureCreateCredentialParams {
    const keyOptions = options.publicKey;

    if (keyOptions == undefined) {
      throw new Error("Public-key options not found");
    }

    return {
      attestation: keyOptions.attestation,
      authenticatorSelection: {
        requireResidentKey: keyOptions.authenticatorSelection?.requireResidentKey,
        residentKey: keyOptions.authenticatorSelection?.residentKey,
        userVerification: keyOptions.authenticatorSelection?.userVerification,
      },
      challenge: Fido2Utils.bufferToString(keyOptions.challenge),
      excludeCredentials: keyOptions.excludeCredentials?.map((credential) => ({
        id: Fido2Utils.bufferToString(credential.id),
        transports: credential.transports,
        type: credential.type,
      })),
      extensions: undefined, // extensions not currently supported
      pubKeyCredParams: keyOptions.pubKeyCredParams.map((params) => ({
        alg: params.alg,
        type: params.type,
      })),
      rp: {
        id: keyOptions.rp.id,
        name: keyOptions.rp.name,
      },
      user: {
        id: Fido2Utils.bufferToString(keyOptions.user.id),
        displayName: keyOptions.user.displayName,
        name: keyOptions.user.name,
      },
      timeout: keyOptions.timeout,
      fallbackSupported,
    };
  }

  static mapCredentialRegistrationResult(result: CreateCredentialResult): PublicKeyCredential {
    const credential = {
      id: result.credentialId,
      rawId: Fido2Utils.stringToBuffer(result.credentialId),
      type: "public-key",
      authenticatorAttachment: "cross-platform",
      response: {
        clientDataJSON: Fido2Utils.stringToBuffer(result.clientDataJSON),
        attestationObject: Fido2Utils.stringToBuffer(result.attestationObject),

        getAuthenticatorData(): ArrayBuffer {
          return Fido2Utils.stringToBuffer(result.authData);
        },

        getPublicKey(): ArrayBuffer {
          return Fido2Utils.stringToBuffer(result.publicKey);
        },

        getPublicKeyAlgorithm(): number {
          return result.publicKeyAlgorithm;
        },

        getTransports(): string[] {
          return result.transports;
        },
      } as AuthenticatorAttestationResponse,
      getClientExtensionResults: () => ({}),
    } as PublicKeyCredential;

    // Modify prototype chains to fix `instanceof` calls.
    // This makes these objects indistinguishable from the native classes.
    // Unfortunately PublicKeyCredential does not have a javascript constructor so `extends` does not work here.
    Object.setPrototypeOf(credential.response, AuthenticatorAttestationResponse.prototype);
    Object.setPrototypeOf(credential, PublicKeyCredential.prototype);

    return credential;
  }

  static mapCredentialRequestOptions(
    options: CredentialRequestOptions,
    fallbackSupported: boolean
  ): InsecureAssertCredentialParams {
    const keyOptions = options.publicKey;

    if (keyOptions == undefined) {
      throw new Error("Public-key options not found");
    }

    return {
      allowedCredentialIds:
        keyOptions.allowCredentials?.map((c) => Fido2Utils.bufferToString(c.id)) ?? [],
      challenge: Fido2Utils.bufferToString(keyOptions.challenge),
      rpId: keyOptions.rpId,
      userVerification: keyOptions.userVerification,
      timeout: keyOptions.timeout,
      fallbackSupported,
    };
  }

  static mapCredentialAssertResult(result: AssertCredentialResult): PublicKeyCredential {
    const credential = {
      id: result.credentialId,
      rawId: Fido2Utils.stringToBuffer(result.credentialId),
      type: "public-key",
      response: {
        authenticatorData: Fido2Utils.stringToBuffer(result.authenticatorData),
        clientDataJSON: Fido2Utils.stringToBuffer(result.clientDataJSON),
        signature: Fido2Utils.stringToBuffer(result.signature),
        userHandle: Fido2Utils.stringToBuffer(result.userHandle),
      } as AuthenticatorAssertionResponse,
      getClientExtensionResults: () => ({}),
      authenticatorAttachment: "cross-platform",
    } as PublicKeyCredential;

    // Modify prototype chains to fix `instanceof` calls.
    // This makes these objects indistinguishable from the native classes.
    // Unfortunately PublicKeyCredential does not have a javascript constructor so `extends` does not work here.
    Object.setPrototypeOf(credential.response, AuthenticatorAssertionResponse.prototype);
    Object.setPrototypeOf(credential, PublicKeyCredential.prototype);

    return credential;
  }
}
