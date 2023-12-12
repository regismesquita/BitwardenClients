import { Jsonify } from "type-fest";

import Domain from "../../../platform/models/domain/domain-base";
import { EncString } from "../../../platform/models/domain/enc-string";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";
import { UriMatchType } from "../../enums";
import { LoginUriData } from "../data/login-uri.data";
import { LoginUriView } from "../view/login-uri.view";

export class LoginUri extends Domain {
  uri: EncString;
  match: UriMatchType;

  constructor(obj?: LoginUriData) {
    super();
    if (obj == null) {
      return;
    }

    this.match = obj.match;
    this.buildDomainModel(
      this,
      obj,
      {
        uri: null,
      },
      []
    );
  }

  decrypt(orgId: string, encKey?: SymmetricCryptoKey): Promise<LoginUriView> {
    return this.decryptObj(
      new LoginUriView(this),
      {
        uri: null,
      },
      orgId,
      encKey
    );
  }

  toLoginUriData(): LoginUriData {
    const u = new LoginUriData();
    this.buildDataModel(
      this,
      u,
      {
        uri: null,
        match: null,
      },
      ["match"]
    );
    return u;
  }

  static fromJSON(obj: Jsonify<LoginUri>): LoginUri {
    if (obj == null) {
      return null;
    }

    const uri = EncString.fromJSON(obj.uri);
    return Object.assign(new LoginUri(), obj, {
      uri,
    });
  }
}
