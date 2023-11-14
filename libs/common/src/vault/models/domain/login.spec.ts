import { mock } from "jest-mock-extended";

import { mockEnc, mockFromJson } from "../../../../spec";
import { UriMatchType } from "../../../enums";
import { EncryptedString, EncString } from "../../../platform/models/domain/enc-string";
import { Fido2CredentialApi } from "../../api/fido2-credential.api";
import { LoginData } from "../../models/data/login.data";
import { Login } from "../../models/domain/login";
import { LoginUri } from "../../models/domain/login-uri";
import { LoginUriView } from "../../models/view/login-uri.view";
import { Fido2CredentialData } from "../data/fido2-credential.data";
import { Fido2CredentialView } from "../view/fido2-credential.view";

import { Fido2Credential } from "./fido2-credential";

describe("Login DTO", () => {
  it("Convert from empty LoginData", () => {
    const data = new LoginData();
    const login = new Login(data);

    expect(login).toEqual({
      passwordRevisionDate: null,
      autofillOnPageLoad: undefined,
      username: null,
      password: null,
      totp: null,
    });
  });

  it("Convert from full LoginData", () => {
    const fido2CredentialData = initializeFido2Credential(new Fido2CredentialData());
    const data: LoginData = {
      uris: [{ uri: "uri", match: UriMatchType.Domain }],
      username: "username",
      password: "password",
      passwordRevisionDate: "2022-01-31T12:00:00.000Z",
      totp: "123",
      autofillOnPageLoad: false,
      fido2Credentials: [fido2CredentialData],
    };
    const login = new Login(data);

    expect(login).toEqual({
      passwordRevisionDate: new Date("2022-01-31T12:00:00.000Z"),
      autofillOnPageLoad: false,
      username: { encryptedString: "username", encryptionType: 0 },
      password: { encryptedString: "password", encryptionType: 0 },
      totp: { encryptedString: "123", encryptionType: 0 },
      uris: [{ match: 0, uri: { encryptedString: "uri", encryptionType: 0 } }],
      fido2Credentials: [encryptFido2Credential(fido2CredentialData)],
    });
  });

  it("Initialize without LoginData", () => {
    const login = new Login();

    expect(login).toEqual({});
  });

  it("Decrypts correctly", async () => {
    const loginUri = mock<LoginUri>();
    const loginUriView = new LoginUriView();
    loginUriView.uri = "decrypted uri";
    loginUri.decrypt.mockResolvedValue(loginUriView);

    const login = new Login();
    const decryptedFido2Credential = Symbol();
    login.uris = [loginUri];
    login.username = mockEnc("encrypted username");
    login.password = mockEnc("encrypted password");
    login.passwordRevisionDate = new Date("2022-01-31T12:00:00.000Z");
    login.totp = mockEnc("encrypted totp");
    login.autofillOnPageLoad = true;
    login.fido2Credentials = [
      { decrypt: jest.fn().mockReturnValue(decryptedFido2Credential) } as any,
    ];

    const loginView = await login.decrypt(null);
    expect(loginView).toEqual({
      username: "encrypted username",
      password: "encrypted password",
      passwordRevisionDate: new Date("2022-01-31T12:00:00.000Z"),
      totp: "encrypted totp",
      uris: [
        {
          match: null,
          _uri: "decrypted uri",
          _domain: null,
          _hostname: null,
          _host: null,
          _canLaunch: null,
        },
      ],
      autofillOnPageLoad: true,
      fido2Credentials: [decryptedFido2Credential],
    });
  });

  it("Converts from LoginData and back", () => {
    const data: LoginData = {
      uris: [{ uri: "uri", match: UriMatchType.Domain }],
      username: "username",
      password: "password",
      passwordRevisionDate: "2022-01-31T12:00:00.000Z",
      totp: "123",
      autofillOnPageLoad: false,
      fido2Credentials: [initializeFido2Credential(new Fido2CredentialData())],
    };
    const login = new Login(data);

    const loginData = login.toLoginData();

    expect(loginData).toEqual(data);
  });

  describe("fromJSON", () => {
    it("initializes nested objects", () => {
      jest.spyOn(EncString, "fromJSON").mockImplementation(mockFromJson);
      jest.spyOn(LoginUri, "fromJSON").mockImplementation(mockFromJson);
      const passwordRevisionDate = new Date("2022-01-31T12:00:00.000Z");
      const fido2CreationDate = new Date("2023-01-01T12:00:00.000Z");

      const actual = Login.fromJSON({
        uris: ["loginUri1", "loginUri2"] as any,
        username: "myUsername" as EncryptedString,
        password: "myPassword" as EncryptedString,
        passwordRevisionDate: passwordRevisionDate.toISOString(),
        totp: "myTotp" as EncryptedString,
        fido2Credentials: [
          {
            credentialId: "keyId" as EncryptedString,
            keyType: "keyType" as EncryptedString,
            keyAlgorithm: "keyAlgorithm" as EncryptedString,
            keyCurve: "keyCurve" as EncryptedString,
            keyValue: "keyValue" as EncryptedString,
            rpId: "rpId" as EncryptedString,
            userHandle: "userHandle" as EncryptedString,
            counter: "counter" as EncryptedString,
            rpName: "rpName" as EncryptedString,
            userDisplayName: "userDisplayName" as EncryptedString,
            discoverable: "discoverable" as EncryptedString,
            creationDate: fido2CreationDate.toISOString(),
          },
        ],
      });

      expect(actual).toEqual({
        uris: ["loginUri1_fromJSON", "loginUri2_fromJSON"] as any,
        username: "myUsername_fromJSON",
        password: "myPassword_fromJSON",
        passwordRevisionDate: passwordRevisionDate,
        totp: "myTotp_fromJSON",
        fido2Credentials: [
          {
            credentialId: "keyId_fromJSON",
            keyType: "keyType_fromJSON",
            keyAlgorithm: "keyAlgorithm_fromJSON",
            keyCurve: "keyCurve_fromJSON",
            keyValue: "keyValue_fromJSON",
            rpId: "rpId_fromJSON",
            userHandle: "userHandle_fromJSON",
            counter: "counter_fromJSON",
            rpName: "rpName_fromJSON",
            userDisplayName: "userDisplayName_fromJSON",
            discoverable: "discoverable_fromJSON",
            creationDate: fido2CreationDate,
          },
        ],
      });
      expect(actual).toBeInstanceOf(Login);
    });

    it("returns null if object is null", () => {
      expect(Login.fromJSON(null)).toBeNull();
    });
  });
});

type Fido2CredentialLike = Fido2CredentialData | Fido2CredentialView | Fido2CredentialApi;
function initializeFido2Credential<T extends Fido2CredentialLike>(key: T): T {
  key.credentialId = "credentialId";
  key.keyType = "public-key";
  key.keyAlgorithm = "ECDSA";
  key.keyCurve = "P-256";
  key.keyValue = "keyValue";
  key.rpId = "rpId";
  key.userHandle = "userHandle";
  key.counter = "counter";
  key.rpName = "rpName";
  key.userDisplayName = "userDisplayName";
  key.discoverable = "discoverable";
  key.creationDate = "2023-01-01T12:00:00.000Z";
  return key;
}

function encryptFido2Credential(key: Fido2CredentialLike): Fido2Credential {
  const encrypted = new Fido2Credential();
  encrypted.credentialId = { encryptedString: key.credentialId, encryptionType: 0 } as EncString;
  encrypted.keyType = { encryptedString: key.keyType, encryptionType: 0 } as EncString;
  encrypted.keyAlgorithm = { encryptedString: key.keyAlgorithm, encryptionType: 0 } as EncString;
  encrypted.keyCurve = { encryptedString: key.keyCurve, encryptionType: 0 } as EncString;
  encrypted.keyValue = { encryptedString: key.keyValue, encryptionType: 0 } as EncString;
  encrypted.rpId = { encryptedString: key.rpId, encryptionType: 0 } as EncString;
  encrypted.userHandle = { encryptedString: key.userHandle, encryptionType: 0 } as EncString;
  encrypted.counter = { encryptedString: key.counter, encryptionType: 0 } as EncString;
  encrypted.rpName = { encryptedString: key.rpName, encryptionType: 0 } as EncString;
  encrypted.userDisplayName = {
    encryptedString: key.userDisplayName,
    encryptionType: 0,
  } as EncString;
  encrypted.discoverable = { encryptedString: key.discoverable, encryptionType: 0 } as EncString;

  // not encrypted
  encrypted.creationDate = new Date(key.creationDate);
  return encrypted;
}
