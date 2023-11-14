import { ipcRenderer } from "electron";

import { DeviceType, ThemeType, KeySuffixOptions } from "@bitwarden/common/enums";

import { BiometricMessage, BiometricAction } from "../types/biometric-message";
import { isDev, isWindowsStore } from "../utils";

import { ClipboardWriteMessage } from "./types/clipboard";

const storage = {
  get: <T>(key: string): Promise<T> => ipcRenderer.invoke("storageService", { action: "get", key }),
  has: (key: string): Promise<boolean> =>
    ipcRenderer.invoke("storageService", { action: "has", key }),
  save: (key: string, obj: any): Promise<void> =>
    ipcRenderer.invoke("storageService", { action: "save", key, obj }),
  remove: (key: string): Promise<void> =>
    ipcRenderer.invoke("storageService", { action: "remove", key }),
};

const passwords = {
  get: (key: string, keySuffix: string): Promise<string> =>
    ipcRenderer.invoke("keytar", { action: "getPassword", key, keySuffix }),
  has: (key: string, keySuffix: string): Promise<boolean> =>
    ipcRenderer.invoke("keytar", { action: "hasPassword", key, keySuffix }),
  set: (key: string, keySuffix: string, value: string): Promise<void> =>
    ipcRenderer.invoke("keytar", { action: "setPassword", key, keySuffix, value }),
  delete: (key: string, keySuffix: string): Promise<void> =>
    ipcRenderer.invoke("keytar", { action: "deletePassword", key, keySuffix }),
};

const biometric = {
  enabled: (userId: string): Promise<boolean> =>
    ipcRenderer.invoke("biometric", {
      action: BiometricAction.EnabledForUser,
      key: `${userId}_user_biometric`,
      keySuffix: KeySuffixOptions.Biometric,
      userId: userId,
    } satisfies BiometricMessage),
  osSupported: (): Promise<boolean> =>
    ipcRenderer.invoke("biometric", {
      action: BiometricAction.OsSupported,
    } satisfies BiometricMessage),
  authenticate: (): Promise<boolean> =>
    ipcRenderer.invoke("biometric", {
      action: BiometricAction.Authenticate,
    } satisfies BiometricMessage),
};

const clipboard = {
  read: (): Promise<string> => ipcRenderer.invoke("clipboard.read"),
  write: (message: ClipboardWriteMessage) => ipcRenderer.invoke("clipboard.write", message),
};

export default {
  versions: {
    app: (): Promise<string> => ipcRenderer.invoke("appVersion"),
  },
  deviceType: deviceType(),
  isDev: isDev(),
  isWindowsStore: isWindowsStore(),
  reloadProcess: () => ipcRenderer.send("reload-process"),

  openContextMenu: (
    menu: {
      label?: string;
      type?: "normal" | "separator" | "submenu" | "checkbox" | "radio";
    }[]
  ): Promise<number> => ipcRenderer.invoke("openContextMenu", { menu }),

  getSystemTheme: (): Promise<ThemeType> => ipcRenderer.invoke("systemTheme"),
  onSystemThemeUpdated: (callback: (theme: ThemeType) => void) => {
    ipcRenderer.on("systemThemeUpdated", (_event, theme: ThemeType) => callback(theme));
  },

  isWindowVisible: (): Promise<boolean> => ipcRenderer.invoke("windowVisible"),

  getLanguageFile: (formattedLocale: string): Promise<object> =>
    ipcRenderer.invoke("getLanguageFile", formattedLocale),

  sendMessage: (message: { command: string } & any) =>
    ipcRenderer.send("messagingService", message),
  onMessage: (callback: (message: { command: string } & any) => void) => {
    ipcRenderer.on("messagingService", (_event, message: any) => {
      if (message.command) {
        callback(message);
      }
    });
  },

  launchUri: (uri: string) => ipcRenderer.invoke("launchUri", uri),

  storage,
  passwords,
  biometric,
  clipboard,
};

function deviceType(): DeviceType {
  switch (process.platform) {
    case "win32":
      return DeviceType.WindowsDesktop;
    case "darwin":
      return DeviceType.MacOsDesktop;
    default:
      return DeviceType.LinuxDesktop;
  }
}
