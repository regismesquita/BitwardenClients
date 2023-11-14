import { Jsonify } from "type-fest";

import { UriMatchType } from "../../../enums";
import { View } from "../../../models/view/view";
import { SafeUrls } from "../../../platform/misc/safe-urls";
import { Utils } from "../../../platform/misc/utils";
import { LoginUri } from "../domain/login-uri";

export class LoginUriView implements View {
  match: UriMatchType = null;

  private _uri: string = null;
  private _domain: string = null;
  private _hostname: string = null;
  private _host: string = null;
  private _canLaunch: boolean = null;

  constructor(u?: LoginUri) {
    if (!u) {
      return;
    }

    this.match = u.match;
  }

  get uri(): string {
    return this._uri;
  }
  set uri(value: string) {
    this._uri = value;
    this._domain = null;
    this._canLaunch = null;
  }

  get domain(): string {
    if (this._domain == null && this.uri != null) {
      this._domain = Utils.getDomain(this.uri);
      if (this._domain === "") {
        this._domain = null;
      }
    }

    return this._domain;
  }

  get hostname(): string {
    if (this.match === UriMatchType.RegularExpression) {
      return null;
    }
    if (this._hostname == null && this.uri != null) {
      this._hostname = Utils.getHostname(this.uri);
      if (this._hostname === "") {
        this._hostname = null;
      }
    }

    return this._hostname;
  }

  get host(): string {
    if (this.match === UriMatchType.RegularExpression) {
      return null;
    }
    if (this._host == null && this.uri != null) {
      this._host = Utils.getHost(this.uri);
      if (this._host === "") {
        this._host = null;
      }
    }

    return this._host;
  }

  get hostnameOrUri(): string {
    return this.hostname != null ? this.hostname : this.uri;
  }

  get hostOrUri(): string {
    return this.host != null ? this.host : this.uri;
  }

  get isWebsite(): boolean {
    return (
      this.uri != null &&
      (this.uri.indexOf("http://") === 0 ||
        this.uri.indexOf("https://") === 0 ||
        (this.uri.indexOf("://") < 0 && !Utils.isNullOrWhitespace(Utils.getDomain(this.uri))))
    );
  }

  get canLaunch(): boolean {
    if (this._canLaunch != null) {
      return this._canLaunch;
    }
    if (this.uri != null && this.match !== UriMatchType.RegularExpression) {
      this._canLaunch = SafeUrls.canLaunch(this.launchUri);
    } else {
      this._canLaunch = false;
    }
    return this._canLaunch;
  }

  get launchUri(): string {
    return this.uri.indexOf("://") < 0 && !Utils.isNullOrWhitespace(Utils.getDomain(this.uri))
      ? "http://" + this.uri
      : this.uri;
  }

  static fromJSON(obj: Partial<Jsonify<LoginUriView>>): LoginUriView {
    return Object.assign(new LoginUriView(), obj);
  }

  matchesUri(
    targetUri: string,
    equivalentDomains: Set<string>,
    defaultUriMatch: UriMatchType = null
  ): boolean {
    if (!this.uri || !targetUri) {
      return false;
    }

    let matchType = this.match ?? defaultUriMatch;
    matchType ??= UriMatchType.Domain;

    const targetDomain = Utils.getDomain(targetUri);
    const matchDomains = equivalentDomains.add(targetDomain);

    switch (matchType) {
      case UriMatchType.Domain:
        return this.matchesDomain(targetUri, matchDomains);
      case UriMatchType.Host: {
        const urlHost = Utils.getHost(targetUri);
        return urlHost != null && urlHost === Utils.getHost(this.uri);
      }
      case UriMatchType.Exact:
        return targetUri === this.uri;
      case UriMatchType.StartsWith:
        return targetUri.startsWith(this.uri);
      case UriMatchType.RegularExpression:
        try {
          const regex = new RegExp(this.uri, "i");
          return regex.test(targetUri);
        } catch (e) {
          // Invalid regex
          return false;
        }
      case UriMatchType.Never:
        return false;
      default:
        break;
    }

    return false;
  }

  private matchesDomain(targetUri: string, matchDomains: Set<string>) {
    if (targetUri == null || this.domain == null || !matchDomains.has(this.domain)) {
      return false;
    }

    if (Utils.DomainMatchBlacklist.has(this.domain)) {
      const domainUrlHost = Utils.getHost(targetUri);
      return !Utils.DomainMatchBlacklist.get(this.domain).has(domainUrlHost);
    }

    return true;
  }
}
