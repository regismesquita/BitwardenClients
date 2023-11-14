export type RendererMenuItem = {
  label?: string;
  type?: "normal" | "separator" | "submenu" | "checkbox" | "radio";
  click?: () => any;
};

export function invokeMenu(menu: RendererMenuItem[]) {
  const menuWithoutClick = menu.map((m) => {
    return { label: m.label, type: m.type };
  });
  ipc.platform.openContextMenu(menuWithoutClick).then((i: number) => {
    if (i !== -1) {
      menu[i].click();
    }
  });
}

export function isDev() {
  // ref: https://github.com/sindresorhus/electron-is-dev
  if ("ELECTRON_IS_DEV" in process.env) {
    return parseInt(process.env.ELECTRON_IS_DEV, 10) === 1;
  }
  return process.defaultApp || /node_modules[\\/]electron[\\/]/.test(process.execPath);
}

export function isLinux() {
  return process.platform === "linux";
}

export function isAppImage() {
  return isLinux() && "APPIMAGE" in process.env;
}

export function isSnapStore() {
  return isLinux() && process.env.SNAP_USER_DATA != null;
}

export function isMac() {
  return process.platform === "darwin";
}

export function isMacAppStore() {
  return isMac() && process.mas === true;
}

export function isWindows() {
  return process.platform === "win32";
}

export function isWindowsStore() {
  const windows = isWindows();
  let windowsStore = process.windowsStore;
  if (
    windows &&
    !windowsStore &&
    process.resourcesPath.indexOf("8bitSolutionsLLC.bitwardendesktop_") > -1
  ) {
    windowsStore = true;
  }
  return windows && windowsStore === true;
}

export function isWindowsPortable() {
  return isWindows() && process.env.PORTABLE_EXECUTABLE_DIR != null;
}

/**
 * Sanitize user agent so external resources used by the app can't built data on our users.
 */
export function cleanUserAgent(userAgent: string): string {
  const userAgentItem = (startString: string, endString: string) => {
    const startIndex = userAgent.indexOf(startString);
    return userAgent.substring(startIndex, userAgent.indexOf(endString, startIndex) + 1);
  };
  const systemInformation = "(Windows NT 10.0; Win64; x64)";

  // Set system information, remove bitwarden, and electron information
  return userAgent
    .replace(userAgentItem("(", ")"), systemInformation)
    .replace(userAgentItem("Bitwarden", " "), "")
    .replace(userAgentItem("Electron", " "), "");
}
