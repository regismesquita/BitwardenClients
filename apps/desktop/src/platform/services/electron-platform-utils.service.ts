import { ClientType, DeviceType } from "@bitwarden/common/enums";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import {
  ClipboardOptions,
  PlatformUtilsService,
} from "@bitwarden/common/platform/abstractions/platform-utils.service";

import { isMacAppStore } from "../../utils";
import { ClipboardWriteMessage } from "../types/clipboard";

export class ElectronPlatformUtilsService implements PlatformUtilsService {
  constructor(protected i18nService: I18nService, private messagingService: MessagingService) {}

  getDevice(): DeviceType {
    return ipc.platform.deviceType;
  }

  getDeviceString(): string {
    const device = DeviceType[this.getDevice()].toLowerCase();
    return device.replace("desktop", "");
  }

  getClientType() {
    return ClientType.Desktop;
  }

  isFirefox(): boolean {
    return false;
  }

  isChrome(): boolean {
    return true;
  }

  isEdge(): boolean {
    return false;
  }

  isOpera(): boolean {
    return false;
  }

  isVivaldi(): boolean {
    return false;
  }

  isSafari(): boolean {
    return false;
  }

  isMacAppStore(): boolean {
    return isMacAppStore();
  }

  isViewOpen(): Promise<boolean> {
    return Promise.resolve(false);
  }

  launchUri(uri: string, options?: any): void {
    ipc.platform.launchUri(uri);
  }

  getApplicationVersion(): Promise<string> {
    return ipc.platform.versions.app();
  }

  async getApplicationVersionNumber(): Promise<string> {
    return (await this.getApplicationVersion()).split(/[+|-]/)[0].trim();
  }

  supportsWebAuthn(win: Window): boolean {
    return true;
  }

  supportsDuo(): boolean {
    return true;
  }

  showToast(
    type: "error" | "success" | "warning" | "info",
    title: string,
    text: string | string[],
    options?: any
  ): void {
    this.messagingService.send("showToast", {
      text: text,
      title: title,
      type: type,
      options: options,
    });
  }

  isDev(): boolean {
    return ipc.platform.isDev;
  }

  isSelfHost(): boolean {
    return false;
  }

  copyToClipboard(text: string, options?: ClipboardOptions): void {
    const clearing = options?.clearing === true;
    const clearMs = options?.clearMs ?? null;

    ipc.platform.clipboard.write({
      text: text,
      password: (options?.allowHistory ?? false) === false, // default to false
    } satisfies ClipboardWriteMessage);

    if (!clearing) {
      this.messagingService.send("copiedToClipboard", {
        clipboardValue: text,
        clearMs: clearMs,
        clearing: clearing,
      });
    }
  }

  readFromClipboard(): Promise<string> {
    return ipc.platform.clipboard.read();
  }

  async supportsBiometric(): Promise<boolean> {
    return await ipc.platform.biometric.osSupported();
  }

  /** This method is used to authenticate the user presence _only_.
   * It should not be used in the process to retrieve
   * biometric keys, which has a separate authentication mechanism.
   * For biometric keys, invoke "keytar" with a biometric key suffix */
  async authenticateBiometric(): Promise<boolean> {
    return await ipc.platform.biometric.authenticate();
  }

  supportsSecureStorage(): boolean {
    return true;
  }

  getAutofillKeyboardShortcut(): Promise<string> {
    return null;
  }
}
