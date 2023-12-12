import { Jsonify } from "type-fest";

import { Utils } from "../../../platform/misc/utils";
import { LoginLinkedId as LinkedId, UriMatchType } from "../../enums";
import { linkedFieldOption } from "../../linked-field-option.decorator";
import { Login } from "../domain/login";

import { Fido2CredentialView } from "./fido2-credential.view";
import { ItemView } from "./item.view";
import { LoginUriView } from "./login-uri.view";

export class LoginView extends ItemView {
  @linkedFieldOption(LinkedId.Username)
  username: string = null;
  @linkedFieldOption(LinkedId.Password)
  password: string = null;

  passwordRevisionDate?: Date = null;
  totp: string = null;
  uris: LoginUriView[] = null;
  autofillOnPageLoad: boolean = null;
  fido2Credentials: Fido2CredentialView[] = null;

  constructor(l?: Login) {
    super();
    if (!l) {
      return;
    }

    this.passwordRevisionDate = l.passwordRevisionDate;
    this.autofillOnPageLoad = l.autofillOnPageLoad;
  }

  get uri(): string {
    return this.hasUris ? this.uris[0].uri : null;
  }

  get maskedPassword(): string {
    return this.password != null ? "••••••••" : null;
  }

  get subTitle(): string {
    return this.username;
  }

  get canLaunch(): boolean {
    return this.hasUris && this.uris.some((u) => u.canLaunch);
  }

  get hasTotp(): boolean {
    return !Utils.isNullOrWhitespace(this.totp);
  }

  get launchUri(): string {
    if (this.hasUris) {
      const uri = this.uris.find((u) => u.canLaunch);
      if (uri != null) {
        return uri.launchUri;
      }
    }
    return null;
  }

  get hasUris(): boolean {
    return this.uris != null && this.uris.length > 0;
  }

  get hasFido2Credentials(): boolean {
    return this.fido2Credentials != null && this.fido2Credentials.length > 0;
  }

  matchesUri(
    targetUri: string,
    equivalentDomains: Set<string>,
    defaultUriMatch: UriMatchType = null
  ): boolean {
    if (this.uris == null) {
      return false;
    }

    return this.uris.some((uri) => uri.matchesUri(targetUri, equivalentDomains, defaultUriMatch));
  }

  static fromJSON(obj: Partial<Jsonify<LoginView>>): LoginView {
    const passwordRevisionDate =
      obj.passwordRevisionDate == null ? null : new Date(obj.passwordRevisionDate);
    const uris = obj.uris?.map((uri: any) => LoginUriView.fromJSON(uri));
    const fido2Credentials = obj.fido2Credentials?.map((key) => Fido2CredentialView.fromJSON(key));

    return Object.assign(new LoginView(), obj, {
      passwordRevisionDate,
      uris,
      fido2Credentials,
    });
  }
}
