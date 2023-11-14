import { JsonObject } from "type-fest";

import { Fido2CredentialApi } from "../../vault/api/fido2-credential.api";
import { BaseResponse } from "../response/base.response";

import { LoginUriApi } from "./login-uri.api";

export class LoginApi extends BaseResponse {
  uris: LoginUriApi[];
  username: string;
  password: string;
  passwordRevisionDate: string;
  totp: string;
  autofillOnPageLoad: boolean;
  fido2Credentials?: Fido2CredentialApi[];

  constructor(data: any = null) {
    super(data);
    if (data == null) {
      return;
    }
    this.username = this.getResponseProperty("Username");
    this.password = this.getResponseProperty("Password");
    this.passwordRevisionDate = this.getResponseProperty("PasswordRevisionDate");
    this.totp = this.getResponseProperty("Totp");
    this.autofillOnPageLoad = this.getResponseProperty("AutofillOnPageLoad");

    const uris = this.getResponseProperty("Uris");
    if (uris != null) {
      this.uris = uris.map((u: any) => new LoginUriApi(u));
    }

    const fido2Credentials = this.getResponseProperty("Fido2Credentials");
    if (fido2Credentials != null) {
      this.fido2Credentials = fido2Credentials.map(
        (key: JsonObject) => new Fido2CredentialApi(key)
      );
    }
  }
}
