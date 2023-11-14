import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";

import BrowserPopupUtils from "../../../platform/popup/browser-popup-utils";

const VaultPopoutType = {
  vaultItemPasswordReprompt: "vault_PasswordReprompt",
  addEditVaultItem: "vault_AddEditVaultItem",
  fido2Popout: "vault_Fido2Popout",
} as const;

/**
 * Opens a popout window that facilitates re-prompting for
 * the password of a vault item.
 *
 * @param senderTab - The tab that sent the request.
 * @param cipherOptions - The cipher id and action to perform.
 */
async function openVaultItemPasswordRepromptPopout(
  senderTab: chrome.tabs.Tab,
  cipherOptions: {
    cipherId: string;
    action: string;
  }
) {
  const { cipherId, action } = cipherOptions;
  const promptWindowPath =
    "popup/index.html#/view-cipher" +
    `?cipherId=${cipherId}` +
    `&senderTabId=${senderTab.id}` +
    `&action=${action}`;

  await BrowserPopupUtils.openPopout(promptWindowPath, {
    singleActionKey: `${VaultPopoutType.vaultItemPasswordReprompt}_${cipherId}`,
    senderWindowId: senderTab.windowId,
    forceCloseExistingWindows: true,
  });
}

/**
 * Opens a popout window that facilitates adding or editing a vault item.
 *
 * @param senderTab - The window id of the sender.
 * @param cipherOptions - Options passed as query params to the popout.
 */
async function openAddEditVaultItemPopout(
  senderTab: chrome.tabs.Tab,
  cipherOptions: { cipherId?: string; cipherType?: CipherType } = {}
) {
  const { cipherId, cipherType } = cipherOptions;
  const { url, windowId } = senderTab;

  let singleActionKey = VaultPopoutType.addEditVaultItem;
  let addEditCipherUrl = "popup/index.html#/edit-cipher?uilocation=popout";
  if (cipherId && !cipherType) {
    singleActionKey += `_${cipherId}`;
    addEditCipherUrl += `&cipherId=${cipherId}`;
  }
  if (cipherType && !cipherId) {
    singleActionKey += `_${cipherType}`;
    addEditCipherUrl += `&type=${cipherType}`;
  }
  if (senderTab.url) {
    addEditCipherUrl += `&uri=${url}`;
  }

  await BrowserPopupUtils.openPopout(addEditCipherUrl, {
    singleActionKey,
    senderWindowId: windowId,
  });
}

/**
 * Closes the add/edit vault item popout window.
 *
 * @param delayClose - The amount of time to wait before closing the popout. Defaults to 0.
 */
async function closeAddEditVaultItemPopout(delayClose = 0) {
  await BrowserPopupUtils.closeSingleActionPopout(VaultPopoutType.addEditVaultItem, delayClose);
}

/**
 * Opens a popout window that facilitates FIDO2
 * authentication and passkey management.
 *
 * @param senderTab - The tab that sent the request.
 * @param options - Options passed as query params to the popout.
 */
async function openFido2Popout(
  senderTab: chrome.tabs.Tab,
  options: {
    sessionId: string;
    fallbackSupported: boolean;
  }
): Promise<chrome.windows.Window["id"]> {
  const { sessionId, fallbackSupported } = options;
  const promptWindowPath =
    "popup/index.html#/fido2" +
    `?sessionId=${sessionId}` +
    `&fallbackSupported=${fallbackSupported}` +
    `&senderTabId=${senderTab.id}` +
    `&senderUrl=${encodeURIComponent(senderTab.url)}`;

  const popoutWindow = await BrowserPopupUtils.openPopout(promptWindowPath, {
    singleActionKey: `${VaultPopoutType.fido2Popout}_${sessionId}`,
    senderWindowId: senderTab.windowId,
    forceCloseExistingWindows: true,
    windowOptions: { height: 450 },
  });

  return popoutWindow.id;
}

/**
 * Closes the FIDO2 popout window associated with the passed session ID.
 *
 * @param sessionId - The session ID of the popout to close.
 */
async function closeFido2Popout(sessionId: string): Promise<void> {
  await BrowserPopupUtils.closeSingleActionPopout(`${VaultPopoutType.fido2Popout}_${sessionId}`);
}

export {
  VaultPopoutType,
  openVaultItemPasswordRepromptPopout,
  openAddEditVaultItemPopout,
  closeAddEditVaultItemPopout,
  openFido2Popout,
  closeFido2Popout,
};
