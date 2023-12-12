import { mock, mockReset } from "jest-mock-extended";

import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { AuthService } from "@bitwarden/common/auth/services/auth.service";
import { ThemeType } from "@bitwarden/common/platform/enums";
import { EnvironmentService } from "@bitwarden/common/platform/services/environment.service";
import { I18nService } from "@bitwarden/common/platform/services/i18n.service";
import { SettingsService } from "@bitwarden/common/services/settings.service";
import { CipherType } from "@bitwarden/common/vault/enums";
import { CipherRepromptType } from "@bitwarden/common/vault/enums/cipher-reprompt-type";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { CipherService } from "@bitwarden/common/vault/services/cipher.service";

import { BrowserApi } from "../../platform/browser/browser-api";
import { BrowserStateService } from "../../platform/services/browser-state.service";
import { SHOW_AUTOFILL_BUTTON } from "../constants";
import {
  createAutofillPageDetailsMock,
  createChromeTabMock,
  createFocusedFieldDataMock,
  createPageDetailMock,
  createPortSpyMock,
} from "../jest/autofill-mocks";
import { flushPromises, sendExtensionRuntimeMessage, sendPortMessage } from "../jest/testing-utils";
import { AutofillService } from "../services/abstractions/autofill.service";
import {
  AutofillOverlayElement,
  AutofillOverlayPort,
  AutofillOverlayVisibility,
  RedirectFocusDirection,
} from "../utils/autofill-overlay.enum";

import OverlayBackground from "./overlay.background";

const iconServerUrl = "https://icons.bitwarden.com/";

describe("OverlayBackground", () => {
  let buttonPortSpy: chrome.runtime.Port;
  let listPortSpy: chrome.runtime.Port;
  let overlayBackground: OverlayBackground;
  const cipherService = mock<CipherService>();
  const autofillService = mock<AutofillService>();
  const authService = mock<AuthService>();
  const environmentService = mock<EnvironmentService>({
    getIconsUrl: () => iconServerUrl,
  });
  const settingsService = mock<SettingsService>();
  const stateService = mock<BrowserStateService>();
  const i18nService = mock<I18nService>();
  const initOverlayElementPorts = (options = { initList: true, initButton: true }) => {
    const { initList, initButton } = options;
    if (initButton) {
      overlayBackground["handlePortOnConnect"](createPortSpyMock(AutofillOverlayPort.Button));
      buttonPortSpy = overlayBackground["overlayButtonPort"];
    }

    if (initList) {
      overlayBackground["handlePortOnConnect"](createPortSpyMock(AutofillOverlayPort.List));
      listPortSpy = overlayBackground["overlayListPort"];
    }

    return { buttonPortSpy, listPortSpy };
  };

  beforeEach(() => {
    overlayBackground = new OverlayBackground(
      cipherService,
      autofillService,
      authService,
      environmentService,
      settingsService,
      stateService,
      i18nService
    );
    overlayBackground.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockReset(cipherService);
  });

  describe("removePageDetails", () => {
    it("removes the page details for a specific tab from the pageDetailsForTab object", () => {
      const tabId = 1;
      overlayBackground["pageDetailsForTab"][tabId] = [createPageDetailMock()];
      overlayBackground.removePageDetails(tabId);

      expect(overlayBackground["pageDetailsForTab"][tabId]).toBeUndefined();
    });
  });

  describe("init", () => {
    it("sets up the extension message listeners, get the overlay's visibility settings, and get the user's auth status", async () => {
      overlayBackground["setupExtensionMessageListeners"] = jest.fn();
      overlayBackground["getOverlayVisibility"] = jest.fn();
      overlayBackground["getAuthStatus"] = jest.fn();

      await overlayBackground.init();

      expect(overlayBackground["setupExtensionMessageListeners"]).toHaveBeenCalled();
      expect(overlayBackground["getOverlayVisibility"]).toHaveBeenCalled();
      expect(overlayBackground["getAuthStatus"]).toHaveBeenCalled();
    });
  });

  describe("updateOverlayCiphers", () => {
    const url = "https://jest-testing-website.com";
    const tab = createChromeTabMock({ url });
    const cipher1 = mock<CipherView>({
      id: "id-1",
      localData: { lastUsedDate: 222 },
      name: "name-1",
      type: CipherType.Login,
      login: { username: "username-1", uri: url },
    });
    const cipher2 = mock<CipherView>({
      id: "id-2",
      localData: { lastUsedDate: 111 },
      name: "name-2",
      type: CipherType.Login,
      login: { username: "username-2", uri: url },
    });

    beforeEach(() => {
      overlayBackground["userAuthStatus"] = AuthenticationStatus.Unlocked;
    });

    it("ignores updating the overlay ciphers if the user's auth status is not unlocked", async () => {
      overlayBackground["userAuthStatus"] = AuthenticationStatus.Locked;
      jest.spyOn(BrowserApi, "getTabFromCurrentWindowId");
      jest.spyOn(cipherService, "getAllDecryptedForUrl");

      await overlayBackground.updateOverlayCiphers();

      expect(BrowserApi.getTabFromCurrentWindowId).not.toHaveBeenCalled();
      expect(cipherService.getAllDecryptedForUrl).not.toHaveBeenCalled();
    });

    it("ignores updating the overlay ciphers if the tab is undefined", async () => {
      jest.spyOn(BrowserApi, "getTabFromCurrentWindowId").mockResolvedValueOnce(undefined);
      jest.spyOn(cipherService, "getAllDecryptedForUrl");

      await overlayBackground.updateOverlayCiphers();

      expect(BrowserApi.getTabFromCurrentWindowId).toHaveBeenCalled();
      expect(cipherService.getAllDecryptedForUrl).not.toHaveBeenCalled();
    });

    it("queries all ciphers for the given url, sort them by last used, and format them for usage in the overlay", async () => {
      jest.spyOn(BrowserApi, "getTabFromCurrentWindowId").mockResolvedValueOnce(tab);
      cipherService.getAllDecryptedForUrl.mockResolvedValue([cipher1, cipher2]);
      cipherService.sortCiphersByLastUsedThenName.mockReturnValue(-1);
      jest.spyOn(BrowserApi, "tabSendMessageData").mockImplementation();
      jest.spyOn(overlayBackground as any, "getOverlayCipherData");

      await overlayBackground.updateOverlayCiphers();

      expect(BrowserApi.getTabFromCurrentWindowId).toHaveBeenCalled();
      expect(cipherService.getAllDecryptedForUrl).toHaveBeenCalledWith(url);
      expect(overlayBackground["cipherService"].sortCiphersByLastUsedThenName).toHaveBeenCalled();
      expect(overlayBackground["overlayLoginCiphers"]).toStrictEqual(
        new Map([
          ["overlay-cipher-0", cipher2],
          ["overlay-cipher-1", cipher1],
        ])
      );
      expect(overlayBackground["getOverlayCipherData"]).toHaveBeenCalled();
    });

    it("posts an `updateOverlayListCiphers` message to the overlay list port, and send a `updateIsOverlayCiphersPopulated` message to the tab indicating that the list of ciphers is populated", async () => {
      overlayBackground["overlayListPort"] = mock<chrome.runtime.Port>();
      cipherService.getAllDecryptedForUrl.mockResolvedValue([cipher1, cipher2]);
      cipherService.sortCiphersByLastUsedThenName.mockReturnValue(-1);
      jest.spyOn(BrowserApi, "getTabFromCurrentWindowId").mockResolvedValueOnce(tab);
      jest.spyOn(BrowserApi, "tabSendMessageData").mockImplementation();

      await overlayBackground.updateOverlayCiphers();

      expect(overlayBackground["overlayListPort"].postMessage).toHaveBeenCalledWith({
        command: "updateOverlayListCiphers",
        ciphers: [
          {
            card: null,
            favorite: cipher2.favorite,
            icon: {
              fallbackImage: "images/bwi-globe.png",
              icon: "bwi-globe",
              image: "https://icons.bitwarden.com//jest-testing-website.com/icon.png",
              imageEnabled: true,
            },
            id: "overlay-cipher-0",
            login: {
              username: "us*******2",
            },
            name: "name-2",
            reprompt: cipher2.reprompt,
            type: 1,
          },
          {
            card: null,
            favorite: cipher1.favorite,
            icon: {
              fallbackImage: "images/bwi-globe.png",
              icon: "bwi-globe",
              image: "https://icons.bitwarden.com//jest-testing-website.com/icon.png",
              imageEnabled: true,
            },
            id: "overlay-cipher-1",
            login: {
              username: "us*******1",
            },
            name: "name-1",
            reprompt: cipher1.reprompt,
            type: 1,
          },
        ],
      });
      expect(BrowserApi.tabSendMessageData).toHaveBeenCalledWith(
        tab,
        "updateIsOverlayCiphersPopulated",
        { isOverlayCiphersPopulated: true }
      );
    });
  });

  describe("getOverlayCipherData", () => {
    const url = "https://jest-testing-website.com";
    const cipher1 = mock<CipherView>({
      id: "id-1",
      localData: { lastUsedDate: 222 },
      name: "name-1",
      type: CipherType.Login,
      login: { username: "username-1", uri: url },
    });
    const cipher2 = mock<CipherView>({
      id: "id-2",
      localData: { lastUsedDate: 111 },
      name: "name-2",
      type: CipherType.Login,
      login: { username: "username-2", uri: url },
    });
    const cipher3 = mock<CipherView>({
      id: "id-3",
      localData: { lastUsedDate: 333 },
      name: "name-3",
      type: CipherType.Card,
      card: { subTitle: "Visa, *6789" },
    });
    const cipher4 = mock<CipherView>({
      id: "id-4",
      localData: { lastUsedDate: 444 },
      name: "name-4",
      type: CipherType.Card,
      card: { subTitle: "Mastercard, *1234" },
    });

    it("formats and returns the cipher data", () => {
      overlayBackground["overlayLoginCiphers"] = new Map([
        ["overlay-cipher-0", cipher2],
        ["overlay-cipher-1", cipher1],
        ["overlay-cipher-2", cipher3],
        ["overlay-cipher-3", cipher4],
      ]);

      const overlayCipherData = overlayBackground["getOverlayCipherData"]();

      expect(overlayCipherData).toStrictEqual([
        {
          card: null,
          favorite: cipher2.favorite,
          icon: {
            fallbackImage: "images/bwi-globe.png",
            icon: "bwi-globe",
            image: "https://icons.bitwarden.com//jest-testing-website.com/icon.png",
            imageEnabled: true,
          },
          id: "overlay-cipher-0",
          login: {
            username: "us*******2",
          },
          name: "name-2",
          reprompt: cipher2.reprompt,
          type: 1,
        },
        {
          card: null,
          favorite: cipher1.favorite,
          icon: {
            fallbackImage: "images/bwi-globe.png",
            icon: "bwi-globe",
            image: "https://icons.bitwarden.com//jest-testing-website.com/icon.png",
            imageEnabled: true,
          },
          id: "overlay-cipher-1",
          login: {
            username: "us*******1",
          },
          name: "name-1",
          reprompt: cipher1.reprompt,
          type: 1,
        },
        {
          card: "Visa, *6789",
          favorite: cipher3.favorite,
          icon: {
            fallbackImage: "",
            icon: "bwi-credit-card",
            image: undefined,
            imageEnabled: true,
          },
          id: "overlay-cipher-2",
          login: null,
          name: "name-3",
          reprompt: cipher3.reprompt,
          type: 3,
        },
        {
          card: "Mastercard, *1234",
          favorite: cipher4.favorite,
          icon: {
            fallbackImage: "",
            icon: "bwi-credit-card",
            image: undefined,
            imageEnabled: true,
          },
          id: "overlay-cipher-3",
          login: null,
          name: "name-4",
          reprompt: cipher4.reprompt,
          type: 3,
        },
      ]);
    });
  });

  describe("obscureName", () => {
    it("returns an empty string if the name is falsy", () => {
      const name: string = undefined;

      const obscureName = overlayBackground["obscureName"](name);

      expect(obscureName).toBe("");
    });

    it("will not attempt to obscure a username that is only a domain", () => {
      const name = "@domain.com";

      const obscureName = overlayBackground["obscureName"](name);

      expect(obscureName).toBe(name);
    });

    it("will obscure all characters of a name that is less than 5 characters expect for the first character", () => {
      const name = "name@domain.com";

      const obscureName = overlayBackground["obscureName"](name);

      expect(obscureName).toBe("n***@domain.com");
    });

    it("will obscure all characters of a name that is greater than 4 characters by less than 6 ", () => {
      const name = "name1@domain.com";

      const obscureName = overlayBackground["obscureName"](name);

      expect(obscureName).toBe("na***@domain.com");
    });

    it("will obscure all characters of a name that is greater than 5 characters except for the first two characters and the last character", () => {
      const name = "name12@domain.com";

      const obscureName = overlayBackground["obscureName"](name);

      expect(obscureName).toBe("na***2@domain.com");
    });
  });

  describe("getAuthStatus", () => {
    it("will update the user's auth status but will not update the overlay ciphers", async () => {
      const authStatus = AuthenticationStatus.Unlocked;
      overlayBackground["userAuthStatus"] = AuthenticationStatus.Unlocked;
      jest.spyOn(overlayBackground["authService"], "getAuthStatus").mockResolvedValue(authStatus);
      jest.spyOn(overlayBackground as any, "updateOverlayButtonAuthStatus").mockImplementation();
      jest.spyOn(overlayBackground as any, "updateOverlayCiphers").mockImplementation();

      const status = await overlayBackground["getAuthStatus"]();

      expect(overlayBackground["authService"].getAuthStatus).toHaveBeenCalled();
      expect(overlayBackground["updateOverlayButtonAuthStatus"]).not.toHaveBeenCalled();
      expect(overlayBackground["updateOverlayCiphers"]).not.toHaveBeenCalled();
      expect(overlayBackground["userAuthStatus"]).toBe(authStatus);
      expect(status).toBe(authStatus);
    });

    it("will update the user's auth status and update the overlay ciphers if the status has been modified", async () => {
      const authStatus = AuthenticationStatus.Unlocked;
      overlayBackground["userAuthStatus"] = AuthenticationStatus.LoggedOut;
      jest.spyOn(overlayBackground["authService"], "getAuthStatus").mockResolvedValue(authStatus);
      jest.spyOn(overlayBackground as any, "updateOverlayButtonAuthStatus").mockImplementation();
      jest.spyOn(overlayBackground as any, "updateOverlayCiphers").mockImplementation();

      await overlayBackground["getAuthStatus"]();

      expect(overlayBackground["authService"].getAuthStatus).toHaveBeenCalled();
      expect(overlayBackground["updateOverlayButtonAuthStatus"]).toHaveBeenCalled();
      expect(overlayBackground["updateOverlayCiphers"]).toHaveBeenCalled();
      expect(overlayBackground["userAuthStatus"]).toBe(authStatus);
    });
  });

  describe("updateOverlayButtonAuthStatus", () => {
    it("will send a message to the button port with the user's auth status", () => {
      overlayBackground["overlayButtonPort"] = mock<chrome.runtime.Port>();
      jest.spyOn(overlayBackground["overlayButtonPort"], "postMessage");

      overlayBackground["updateOverlayButtonAuthStatus"]();

      expect(overlayBackground["overlayButtonPort"].postMessage).toHaveBeenCalledWith({
        command: "updateOverlayButtonAuthStatus",
        authStatus: overlayBackground["userAuthStatus"],
      });
    });
  });

  describe("getTranslations", () => {
    it("will query the overlay page translations if they have not been queried", () => {
      overlayBackground["overlayPageTranslations"] = undefined;
      jest.spyOn(overlayBackground as any, "getTranslations");
      jest.spyOn(overlayBackground["i18nService"], "translate").mockImplementation((key) => key);
      jest.spyOn(BrowserApi, "getUILanguage").mockReturnValue("en");

      const translations = overlayBackground["getTranslations"]();

      expect(overlayBackground["getTranslations"]).toHaveBeenCalled();
      const translationKeys = [
        "opensInANewWindow",
        "bitwardenOverlayButton",
        "toggleBitwardenVaultOverlay",
        "bitwardenVault",
        "unlockYourAccountToViewMatchingLogins",
        "unlockAccount",
        "fillCredentialsFor",
        "partialUsername",
        "view",
        "noItemsToShow",
        "newItem",
        "addNewVaultItem",
      ];
      translationKeys.forEach((key) => {
        expect(overlayBackground["i18nService"].translate).toHaveBeenCalledWith(key);
      });
      expect(translations).toStrictEqual({
        locale: "en",
        opensInANewWindow: "opensInANewWindow",
        buttonPageTitle: "bitwardenOverlayButton",
        toggleBitwardenVaultOverlay: "toggleBitwardenVaultOverlay",
        listPageTitle: "bitwardenVault",
        unlockYourAccount: "unlockYourAccountToViewMatchingLogins",
        unlockAccount: "unlockAccount",
        fillCredentialsFor: "fillCredentialsFor",
        partialUsername: "partialUsername",
        view: "view",
        noItemsToShow: "noItemsToShow",
        newItem: "newItem",
        addNewVaultItem: "addNewVaultItem",
      });
    });
  });

  describe("setupExtensionMessageListeners", () => {
    it("will set up onMessage and onConnect listeners", () => {
      overlayBackground["setupExtensionMessageListeners"]();

      // eslint-disable-next-line
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
      expect(chrome.runtime.onConnect.addListener).toHaveBeenCalled();
    });
  });

  describe("handleExtensionMessage", () => {
    it("will return early if the message command is not present within the extensionMessageHandlers", () => {
      const message = {
        command: "not-a-command",
      };
      const sender = mock<chrome.runtime.MessageSender>({ tab: { id: 1 } });
      const sendResponse = jest.fn();

      const returnValue = overlayBackground["handleExtensionMessage"](
        message,
        sender,
        sendResponse
      );

      expect(returnValue).toBe(undefined);
      expect(sendResponse).not.toHaveBeenCalled();
    });

    it("will trigger the message handler and return undefined if the message does not have a response", () => {
      const message = {
        command: "autofillOverlayElementClosed",
      };
      const sender = mock<chrome.runtime.MessageSender>({ tab: { id: 1 } });
      const sendResponse = jest.fn();
      jest.spyOn(overlayBackground as any, "overlayElementClosed");

      const returnValue = overlayBackground["handleExtensionMessage"](
        message,
        sender,
        sendResponse
      );

      expect(returnValue).toBe(undefined);
      expect(sendResponse).not.toHaveBeenCalled();
      expect(overlayBackground["overlayElementClosed"]).toHaveBeenCalledWith(message);
    });

    it("will return a response if the message handler returns a response", async () => {
      const message = {
        command: "openAutofillOverlay",
      };
      const sender = mock<chrome.runtime.MessageSender>({ tab: { id: 1 } });
      const sendResponse = jest.fn();
      jest.spyOn(overlayBackground as any, "getTranslations").mockReturnValue("translations");

      const returnValue = overlayBackground["handleExtensionMessage"](
        message,
        sender,
        sendResponse
      );

      expect(returnValue).toBe(true);
    });

    describe("extension message handlers", () => {
      beforeEach(() => {
        jest
          .spyOn(overlayBackground as any, "getAuthStatus")
          .mockResolvedValue(AuthenticationStatus.Unlocked);
      });

      describe("openAutofillOverlay message handler", () => {
        it("opens the autofill overlay by sending a message to the current tab", async () => {
          const sender = mock<chrome.runtime.MessageSender>({ tab: { id: 1 } });
          jest.spyOn(BrowserApi, "getTabFromCurrentWindowId").mockResolvedValueOnce(sender.tab);
          jest.spyOn(BrowserApi, "tabSendMessageData").mockImplementation();

          sendExtensionRuntimeMessage({ command: "openAutofillOverlay" });
          await flushPromises();

          expect(BrowserApi.tabSendMessageData).toHaveBeenCalledWith(
            sender.tab,
            "openAutofillOverlay",
            {
              isFocusingFieldElement: false,
              isOpeningFullOverlay: false,
              authStatus: AuthenticationStatus.Unlocked,
            }
          );
        });
      });

      describe("autofillOverlayElementClosed message handler", () => {
        beforeEach(() => {
          initOverlayElementPorts();
        });

        it("disconnects the button element port", () => {
          sendExtensionRuntimeMessage({
            command: "autofillOverlayElementClosed",
            overlayElement: AutofillOverlayElement.Button,
          });

          expect(buttonPortSpy.disconnect).toHaveBeenCalled();
          expect(overlayBackground["overlayButtonPort"]).toBeNull();
        });

        it("disconnects the list element port", () => {
          sendExtensionRuntimeMessage({
            command: "autofillOverlayElementClosed",
            overlayElement: AutofillOverlayElement.List,
          });

          expect(listPortSpy.disconnect).toHaveBeenCalled();
          expect(overlayBackground["overlayListPort"]).toBeNull();
        });
      });

      describe("autofillOverlayAddNewVaultItem message handler", () => {
        let sender: chrome.runtime.MessageSender;
        beforeEach(() => {
          sender = mock<chrome.runtime.MessageSender>({ tab: { id: 1 } });
          jest
            .spyOn(overlayBackground["stateService"], "setAddEditCipherInfo")
            .mockImplementation();
          jest.spyOn(overlayBackground as any, "openAddEditVaultItemPopout").mockImplementation();
        });

        it("will not open the add edit popout window if the message does not have a login cipher provided", () => {
          sendExtensionRuntimeMessage({ command: "autofillOverlayAddNewVaultItem" }, sender);

          expect(overlayBackground["stateService"].setAddEditCipherInfo).not.toHaveBeenCalled();
          expect(overlayBackground["openAddEditVaultItemPopout"]).not.toHaveBeenCalled();
        });

        it("will open the add edit popout window after creating a new cipher", async () => {
          sendExtensionRuntimeMessage(
            {
              command: "autofillOverlayAddNewVaultItem",
              login: {
                uri: "https://tacos.com",
                hostname: "",
                username: "username",
                password: "password",
              },
            },
            sender
          );
          await flushPromises();

          expect(overlayBackground["stateService"].setAddEditCipherInfo).toHaveBeenCalled();
          expect(overlayBackground["openAddEditVaultItemPopout"]).toHaveBeenCalled();
        });
      });

      describe("getAutofillOverlayVisibility message handler", () => {
        beforeEach(() => {
          jest
            .spyOn(overlayBackground["settingsService"], "getAutoFillOverlayVisibility")
            .mockResolvedValue(AutofillOverlayVisibility.OnFieldFocus);
        });

        it("will set the overlayVisibility property", async () => {
          sendExtensionRuntimeMessage({ command: "getAutofillOverlayVisibility" });
          await flushPromises();

          expect(overlayBackground["overlayVisibility"]).toBe(
            AutofillOverlayVisibility.OnFieldFocus
          );
        });

        it("returns the overlayVisibility property", async () => {
          const sendMessageSpy = jest.fn();

          sendExtensionRuntimeMessage(
            { command: "getAutofillOverlayVisibility" },
            undefined,
            sendMessageSpy
          );
          await flushPromises();

          expect(sendMessageSpy).toHaveBeenCalledWith(AutofillOverlayVisibility.OnFieldFocus);
        });
      });

      describe("checkAutofillOverlayFocused message handler", () => {
        beforeEach(() => {
          initOverlayElementPorts();
        });

        it("will check if the overlay list is focused if the list port is open", () => {
          sendExtensionRuntimeMessage({ command: "checkAutofillOverlayFocused" });

          expect(listPortSpy.postMessage).toHaveBeenCalledWith({
            command: "checkAutofillOverlayListFocused",
          });
          expect(buttonPortSpy.postMessage).not.toHaveBeenCalledWith({
            command: "checkAutofillOverlayButtonFocused",
          });
        });

        it("will check if the overlay button is focused if the list port is not open", () => {
          overlayBackground["overlayListPort"] = undefined;

          sendExtensionRuntimeMessage({ command: "checkAutofillOverlayFocused" });

          expect(buttonPortSpy.postMessage).toHaveBeenCalledWith({
            command: "checkAutofillOverlayButtonFocused",
          });
          expect(listPortSpy.postMessage).not.toHaveBeenCalledWith({
            command: "checkAutofillOverlayListFocused",
          });
        });
      });

      describe("focusAutofillOverlayList message handler", () => {
        it("will send a `focusOverlayList` message to the overlay list port", () => {
          initOverlayElementPorts({ initList: true, initButton: false });

          sendExtensionRuntimeMessage({ command: "focusAutofillOverlayList" });

          expect(listPortSpy.postMessage).toHaveBeenCalledWith({ command: "focusOverlayList" });
        });
      });

      describe("updateAutofillOverlayPosition message handler", () => {
        beforeEach(() => {
          overlayBackground["handlePortOnConnect"](createPortSpyMock(AutofillOverlayPort.List));
          listPortSpy = overlayBackground["overlayListPort"];
          overlayBackground["handlePortOnConnect"](createPortSpyMock(AutofillOverlayPort.Button));
          buttonPortSpy = overlayBackground["overlayButtonPort"];
        });

        it("ignores updating the position if the overlay element type is not provided", () => {
          sendExtensionRuntimeMessage({ command: "updateAutofillOverlayPosition" });

          expect(listPortSpy.postMessage).not.toHaveBeenCalledWith({
            command: "updateIframePosition",
            styles: expect.anything(),
          });
          expect(buttonPortSpy.postMessage).not.toHaveBeenCalledWith({
            command: "updateIframePosition",
            styles: expect.anything(),
          });
        });

        it("updates the overlay button's position", () => {
          const focusedFieldData = createFocusedFieldDataMock();
          sendExtensionRuntimeMessage({ command: "updateFocusedFieldData", focusedFieldData });

          sendExtensionRuntimeMessage({
            command: "updateAutofillOverlayPosition",
            overlayElement: AutofillOverlayElement.Button,
          });

          expect(buttonPortSpy.postMessage).toHaveBeenCalledWith({
            command: "updateIframePosition",
            styles: { height: "2px", left: "4px", top: "2px", width: "2px" },
          });
        });

        it("modifies the overlay button's height for medium sized input elements", () => {
          const focusedFieldData = createFocusedFieldDataMock({
            focusedFieldRects: { top: 1, left: 2, height: 35, width: 4 },
          });
          sendExtensionRuntimeMessage({ command: "updateFocusedFieldData", focusedFieldData });

          sendExtensionRuntimeMessage({
            command: "updateAutofillOverlayPosition",
            overlayElement: AutofillOverlayElement.Button,
          });

          expect(buttonPortSpy.postMessage).toHaveBeenCalledWith({
            command: "updateIframePosition",
            styles: { height: "20px", left: "-22px", top: "8px", width: "20px" },
          });
        });

        it("modifies the overlay button's height for large sized input elements", () => {
          const focusedFieldData = createFocusedFieldDataMock({
            focusedFieldRects: { top: 1, left: 2, height: 50, width: 4 },
          });
          sendExtensionRuntimeMessage({ command: "updateFocusedFieldData", focusedFieldData });

          sendExtensionRuntimeMessage({
            command: "updateAutofillOverlayPosition",
            overlayElement: AutofillOverlayElement.Button,
          });

          expect(buttonPortSpy.postMessage).toHaveBeenCalledWith({
            command: "updateIframePosition",
            styles: { height: "27px", left: "-32px", top: "13px", width: "27px" },
          });
        });

        it("takes into account the right padding of the focused field in positioning the button if the right padding of the field is larger than the left padding", () => {
          const focusedFieldData = createFocusedFieldDataMock({
            focusedFieldStyles: { paddingRight: "20px", paddingLeft: "6px" },
          });
          sendExtensionRuntimeMessage({ command: "updateFocusedFieldData", focusedFieldData });

          sendExtensionRuntimeMessage({
            command: "updateAutofillOverlayPosition",
            overlayElement: AutofillOverlayElement.Button,
          });

          expect(buttonPortSpy.postMessage).toHaveBeenCalledWith({
            command: "updateIframePosition",
            styles: { height: "2px", left: "-18px", top: "2px", width: "2px" },
          });
        });

        it("will post a message to the overlay list facilitating an update of the list's position", () => {
          const focusedFieldData = createFocusedFieldDataMock();
          sendExtensionRuntimeMessage({ command: "updateFocusedFieldData", focusedFieldData });

          overlayBackground["updateOverlayPosition"]({
            overlayElement: AutofillOverlayElement.List,
          });
          sendExtensionRuntimeMessage({
            command: "updateAutofillOverlayPosition",
            overlayElement: AutofillOverlayElement.List,
          });

          expect(listPortSpy.postMessage).toHaveBeenCalledWith({
            command: "updateIframePosition",
            styles: { left: "2px", top: "4px", width: "4px" },
          });
        });
      });

      describe("updateOverlayHidden", () => {
        beforeEach(() => {
          initOverlayElementPorts();
        });

        it("returns early if the display value is not provided", () => {
          const message = {
            command: "updateAutofillOverlayHidden",
          };

          sendExtensionRuntimeMessage(message);

          expect(buttonPortSpy.postMessage).not.toHaveBeenCalledWith(message);
          expect(listPortSpy.postMessage).not.toHaveBeenCalledWith(message);
        });

        it("posts a message to the overlay button and list with the display value", () => {
          const message = { command: "updateAutofillOverlayHidden", display: "none" };

          sendExtensionRuntimeMessage(message);

          expect(overlayBackground["overlayButtonPort"].postMessage).toHaveBeenCalledWith({
            command: "updateOverlayHidden",
            styles: {
              display: message.display,
            },
          });
          expect(overlayBackground["overlayListPort"].postMessage).toHaveBeenCalledWith({
            command: "updateOverlayHidden",
            styles: {
              display: message.display,
            },
          });
        });
      });

      describe("collectPageDetailsResponse message handler", () => {
        let sender: chrome.runtime.MessageSender;
        const pageDetails1 = createAutofillPageDetailsMock({
          login: { username: "username1", password: "password1" },
        });
        const pageDetails2 = createAutofillPageDetailsMock({
          login: { username: "username2", password: "password2" },
        });

        beforeEach(() => {
          sender = mock<chrome.runtime.MessageSender>({ tab: { id: 1 } });
        });

        it("stores the page details provided by the message by the tab id of the sender", () => {
          sendExtensionRuntimeMessage(
            { command: "collectPageDetailsResponse", details: pageDetails1 },
            sender
          );

          expect(overlayBackground["pageDetailsForTab"][sender.tab.id]).toStrictEqual([
            { frameId: sender.frameId, tab: sender.tab, details: pageDetails1 },
          ]);
        });

        it("updates the page details for a tab that already has a set of page details stored ", () => {
          overlayBackground["pageDetailsForTab"][sender.tab.id] = [
            {
              frameId: sender.frameId,
              tab: sender.tab,
              details: pageDetails1,
            },
          ];

          sendExtensionRuntimeMessage(
            { command: "collectPageDetailsResponse", details: pageDetails2 },
            sender
          );

          expect(overlayBackground["pageDetailsForTab"][sender.tab.id]).toStrictEqual([
            { frameId: sender.frameId, tab: sender.tab, details: pageDetails1 },
            { frameId: sender.frameId, tab: sender.tab, details: pageDetails2 },
          ]);
        });
      });

      describe("unlockCompleted message handler", () => {
        let getAuthStatusSpy: jest.SpyInstance;

        beforeEach(() => {
          overlayBackground["userAuthStatus"] = AuthenticationStatus.LoggedOut;
          jest.spyOn(BrowserApi, "tabSendMessageData");
          getAuthStatusSpy = jest
            .spyOn(overlayBackground as any, "getAuthStatus")
            .mockImplementation(() => {
              overlayBackground["userAuthStatus"] = AuthenticationStatus.Unlocked;
              return Promise.resolve(AuthenticationStatus.Unlocked);
            });
        });

        it("updates the user's auth status but does not open the overlay", async () => {
          const message = {
            command: "unlockCompleted",
            data: {
              commandToRetry: { msg: { command: "" } },
            },
          };

          sendExtensionRuntimeMessage(message);
          await flushPromises();

          expect(getAuthStatusSpy).toHaveBeenCalled();
          expect(BrowserApi.tabSendMessageData).not.toHaveBeenCalled();
        });

        it("updates user's auth status and opens the overlay if a follow up command is provided", async () => {
          const sender = mock<chrome.runtime.MessageSender>({ tab: { id: 1 } });
          const message = {
            command: "unlockCompleted",
            data: {
              commandToRetry: { msg: { command: "openAutofillOverlay" } },
            },
          };
          jest.spyOn(BrowserApi, "getTabFromCurrentWindowId").mockResolvedValueOnce(sender.tab);

          sendExtensionRuntimeMessage(message);
          await flushPromises();

          expect(getAuthStatusSpy).toHaveBeenCalled();
          expect(BrowserApi.tabSendMessageData).toHaveBeenCalledWith(
            sender.tab,
            "openAutofillOverlay",
            {
              isFocusingFieldElement: true,
              isOpeningFullOverlay: false,
              authStatus: AuthenticationStatus.Unlocked,
            }
          );
        });
      });

      describe("addEditCipherSubmitted message handler", () => {
        it("updates the overlay ciphers", () => {
          const message = {
            command: "addEditCipherSubmitted",
          };
          jest.spyOn(overlayBackground as any, "updateOverlayCiphers").mockImplementation();

          sendExtensionRuntimeMessage(message);

          expect(overlayBackground["updateOverlayCiphers"]).toHaveBeenCalled();
        });
      });

      describe("deletedCipher message handler", () => {
        it("updates the overlay ciphers", () => {
          const message = {
            command: "deletedCipher",
          };
          jest.spyOn(overlayBackground as any, "updateOverlayCiphers").mockImplementation();

          sendExtensionRuntimeMessage(message);

          expect(overlayBackground["updateOverlayCiphers"]).toHaveBeenCalled();
        });
      });
    });
  });

  describe("handlePortOnConnect", () => {
    beforeEach(() => {
      jest.spyOn(overlayBackground as any, "updateOverlayPosition").mockImplementation();
      jest.spyOn(overlayBackground as any, "getAuthStatus").mockImplementation();
      jest.spyOn(overlayBackground as any, "getTranslations").mockImplementation();
      jest.spyOn(overlayBackground as any, "getOverlayCipherData").mockImplementation();
    });

    it("skips setting up the overlay port if the port connection is not for an overlay element", () => {
      const port = createPortSpyMock("not-an-overlay-element");

      overlayBackground["handlePortOnConnect"](port);

      expect(port.onMessage.addListener).not.toHaveBeenCalled();
      expect(port.postMessage).not.toHaveBeenCalled();
    });

    it("sets up the overlay list port if the port connection is for the overlay list", async () => {
      initOverlayElementPorts({ initList: true, initButton: false });
      await flushPromises();

      expect(overlayBackground["overlayButtonPort"]).toBeUndefined();
      expect(listPortSpy.onMessage.addListener).toHaveBeenCalled();
      expect(listPortSpy.postMessage).toHaveBeenCalled();
      expect(overlayBackground["getAuthStatus"]).toHaveBeenCalled();
      expect(chrome.runtime.getURL).toHaveBeenCalledWith("overlay/list.css");
      expect(overlayBackground["getTranslations"]).toHaveBeenCalled();
      expect(overlayBackground["getOverlayCipherData"]).toHaveBeenCalled();
      expect(overlayBackground["updateOverlayPosition"]).toHaveBeenCalledWith({
        overlayElement: AutofillOverlayElement.List,
      });
    });

    it("sets up the overlay button port if the port connection is for the overlay button", async () => {
      initOverlayElementPorts({ initList: false, initButton: true });
      await flushPromises();

      expect(overlayBackground["overlayListPort"]).toBeUndefined();
      expect(buttonPortSpy.onMessage.addListener).toHaveBeenCalled();
      expect(buttonPortSpy.postMessage).toHaveBeenCalled();
      expect(overlayBackground["getAuthStatus"]).toHaveBeenCalled();
      expect(chrome.runtime.getURL).toHaveBeenCalledWith("overlay/button.css");
      expect(overlayBackground["getTranslations"]).toHaveBeenCalled();
      expect(overlayBackground["updateOverlayPosition"]).toHaveBeenCalledWith({
        overlayElement: AutofillOverlayElement.Button,
      });
    });

    it("gets the system theme", async () => {
      jest.spyOn(overlayBackground["stateService"], "getTheme").mockResolvedValue(ThemeType.System);
      window.matchMedia = jest.fn(() => mock<MediaQueryList>({ matches: true }));

      initOverlayElementPorts({ initList: true, initButton: false });
      await flushPromises();

      expect(window.matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    });
  });

  describe("handleOverlayElementPortMessage", () => {
    beforeEach(() => {
      initOverlayElementPorts();
      overlayBackground["userAuthStatus"] = AuthenticationStatus.Unlocked;
    });

    it("ignores port messages that do not contain a handler", () => {
      jest.spyOn(overlayBackground as any, "checkOverlayButtonFocused").mockImplementation();

      sendPortMessage(buttonPortSpy, { command: "checkAutofillOverlayButtonFocused" });

      expect(overlayBackground["checkOverlayButtonFocused"]).not.toHaveBeenCalled();
    });

    describe("overlay button message handlers", () => {
      it("unlocks the vault if the user auth status is not unlocked", () => {
        overlayBackground["userAuthStatus"] = AuthenticationStatus.LoggedOut;
        jest.spyOn(overlayBackground as any, "unlockVault").mockImplementation();

        sendPortMessage(buttonPortSpy, { command: "overlayButtonClicked" });

        expect(overlayBackground["unlockVault"]).toHaveBeenCalled();
      });

      it("opens the autofill overlay if the auth status is unlocked", () => {
        jest.spyOn(overlayBackground as any, "openOverlay").mockImplementation();

        sendPortMessage(buttonPortSpy, { command: "overlayButtonClicked" });

        expect(overlayBackground["openOverlay"]).toHaveBeenCalled();
      });

      describe("closeAutofillOverlay", () => {
        it("sends a `closeOverlay` message to the sender tab", () => {
          jest.spyOn(BrowserApi, "tabSendMessageData");

          sendPortMessage(buttonPortSpy, { command: "closeAutofillOverlay" });

          expect(BrowserApi.tabSendMessageData).toHaveBeenCalledWith(
            buttonPortSpy.sender.tab,
            "closeAutofillOverlay",
            { forceCloseOverlay: false }
          );
        });
      });

      describe("forceCloseAutofillOverlay", () => {
        it("sends a `closeOverlay` message to the sender tab with a `forceCloseOverlay` flag of `true` set", () => {
          jest.spyOn(BrowserApi, "tabSendMessageData");

          sendPortMessage(buttonPortSpy, { command: "forceCloseAutofillOverlay" });

          expect(BrowserApi.tabSendMessageData).toHaveBeenCalledWith(
            buttonPortSpy.sender.tab,
            "closeAutofillOverlay",
            { forceCloseOverlay: true }
          );
        });
      });

      describe("overlayPageBlurred", () => {
        it("checks if the overlay list is focused", () => {
          jest.spyOn(overlayBackground as any, "checkOverlayListFocused");

          sendPortMessage(buttonPortSpy, { command: "overlayPageBlurred" });

          expect(overlayBackground["checkOverlayListFocused"]).toHaveBeenCalled();
        });
      });

      describe("redirectOverlayFocusOut", () => {
        beforeEach(() => {
          jest.spyOn(BrowserApi, "tabSendMessageData");
        });

        it("ignores the redirect message if the direction is not provided", () => {
          sendPortMessage(buttonPortSpy, { command: "redirectOverlayFocusOut" });

          expect(BrowserApi.tabSendMessageData).not.toHaveBeenCalled();
        });

        it("sends the redirect message if the direction is provided", () => {
          sendPortMessage(buttonPortSpy, {
            command: "redirectOverlayFocusOut",
            direction: RedirectFocusDirection.Next,
          });

          expect(BrowserApi.tabSendMessageData).toHaveBeenCalledWith(
            buttonPortSpy.sender.tab,
            "redirectOverlayFocusOut",
            { direction: RedirectFocusDirection.Next }
          );
        });
      });
    });

    describe("overlay list message handlers", () => {
      describe("checkAutofillOverlayButtonFocused", () => {
        it("checks on the focus state of the overlay button", () => {
          jest.spyOn(overlayBackground as any, "checkOverlayButtonFocused").mockImplementation();

          sendPortMessage(listPortSpy, { command: "checkAutofillOverlayButtonFocused" });

          expect(overlayBackground["checkOverlayButtonFocused"]).toHaveBeenCalled();
        });
      });

      describe("forceCloseAutofillOverlay", () => {
        it("sends a `closeOverlay` message to the sender tab with a `forceCloseOverlay` flag of `true` set", () => {
          jest.spyOn(BrowserApi, "tabSendMessageData");

          sendPortMessage(listPortSpy, { command: "forceCloseAutofillOverlay" });

          expect(BrowserApi.tabSendMessageData).toHaveBeenCalledWith(
            listPortSpy.sender.tab,
            "closeAutofillOverlay",
            { forceCloseOverlay: true }
          );
        });
      });

      describe("overlayPageBlurred", () => {
        it("checks on the focus state of the overlay button", () => {
          jest.spyOn(overlayBackground as any, "checkOverlayButtonFocused").mockImplementation();

          sendPortMessage(listPortSpy, { command: "overlayPageBlurred" });

          expect(overlayBackground["checkOverlayButtonFocused"]).toHaveBeenCalled();
        });
      });

      describe("unlockVault", () => {
        it("closes the autofill overlay and opens the unlock popout", async () => {
          jest.spyOn(overlayBackground as any, "closeOverlay").mockImplementation();
          jest.spyOn(overlayBackground as any, "openUnlockPopout").mockImplementation();
          jest.spyOn(BrowserApi, "tabSendMessageData").mockImplementation();

          sendPortMessage(listPortSpy, { command: "unlockVault" });
          await flushPromises();

          expect(overlayBackground["closeOverlay"]).toHaveBeenCalledWith(listPortSpy);
          expect(BrowserApi.tabSendMessageData).toHaveBeenCalledWith(
            listPortSpy.sender.tab,
            "addToLockedVaultPendingNotifications",
            {
              commandToRetry: {
                msg: { command: "openAutofillOverlay" },
                sender: listPortSpy.sender,
              },
              target: "overlay.background",
            }
          );
          expect(overlayBackground["openUnlockPopout"]).toHaveBeenCalledWith(
            listPortSpy.sender.tab,
            true
          );
        });
      });

      describe("fillSelectedListItem", () => {
        let getLoginCiphersSpy: jest.SpyInstance;
        let isPasswordRepromptRequiredSpy: jest.SpyInstance;
        let doAutoFillSpy: jest.SpyInstance;

        beforeEach(() => {
          getLoginCiphersSpy = jest.spyOn(overlayBackground["overlayLoginCiphers"], "get");
          isPasswordRepromptRequiredSpy = jest.spyOn(
            overlayBackground["autofillService"],
            "isPasswordRepromptRequired"
          );
          doAutoFillSpy = jest.spyOn(overlayBackground["autofillService"], "doAutoFill");
        });

        it("ignores the fill request if the overlay cipher id is not provided", async () => {
          sendPortMessage(listPortSpy, { command: "fillSelectedListItem" });
          await flushPromises();

          expect(getLoginCiphersSpy).not.toHaveBeenCalled();
          expect(isPasswordRepromptRequiredSpy).not.toHaveBeenCalled();
          expect(doAutoFillSpy).not.toHaveBeenCalled();
        });

        it("ignores the fill request if a master password reprompt is required", async () => {
          const cipher = mock<CipherView>({
            reprompt: CipherRepromptType.Password,
            type: CipherType.Login,
          });
          overlayBackground["overlayLoginCiphers"] = new Map([["overlay-cipher-1", cipher]]);
          getLoginCiphersSpy = jest.spyOn(overlayBackground["overlayLoginCiphers"], "get");
          isPasswordRepromptRequiredSpy.mockResolvedValue(true);

          sendPortMessage(listPortSpy, {
            command: "fillSelectedListItem",
            overlayCipherId: "overlay-cipher-1",
          });
          await flushPromises();

          expect(getLoginCiphersSpy).toHaveBeenCalled();
          expect(isPasswordRepromptRequiredSpy).toHaveBeenCalledWith(
            cipher,
            listPortSpy.sender.tab
          );
          expect(doAutoFillSpy).not.toHaveBeenCalled();
        });

        it("auto-fills the selected cipher and move it to the top of the front of the ciphers map", async () => {
          const cipher1 = mock<CipherView>({ id: "overlay-cipher-1" });
          const cipher2 = mock<CipherView>({ id: "overlay-cipher-2" });
          const cipher3 = mock<CipherView>({ id: "overlay-cipher-3" });
          overlayBackground["overlayLoginCiphers"] = new Map([
            ["overlay-cipher-1", cipher1],
            ["overlay-cipher-2", cipher2],
            ["overlay-cipher-3", cipher3],
          ]);
          isPasswordRepromptRequiredSpy.mockResolvedValue(false);

          sendPortMessage(listPortSpy, {
            command: "fillSelectedListItem",
            overlayCipherId: "overlay-cipher-2",
          });
          await flushPromises();

          expect(isPasswordRepromptRequiredSpy).toHaveBeenCalledWith(
            cipher2,
            listPortSpy.sender.tab
          );
          expect(doAutoFillSpy).toHaveBeenCalledWith({
            tab: listPortSpy.sender.tab,
            cipher: cipher2,
            pageDetails: undefined,
            fillNewPassword: true,
            allowTotpAutofill: true,
          });
          expect(overlayBackground["overlayLoginCiphers"].entries()).toStrictEqual(
            new Map([
              ["overlay-cipher-2", cipher2],
              ["overlay-cipher-1", cipher1],
              ["overlay-cipher-3", cipher3],
            ]).entries()
          );
        });
      });

      describe("getNewVaultItemDetails", () => {
        it("will send an addNewVaultItemFromOverlay message", async () => {
          jest.spyOn(BrowserApi, "tabSendMessage");

          sendPortMessage(listPortSpy, { command: "addNewVaultItem" });
          await flushPromises();

          expect(BrowserApi.tabSendMessage).toHaveBeenCalledWith(listPortSpy.sender.tab, {
            command: "addNewVaultItemFromOverlay",
          });
        });
      });

      describe("viewSelectedCipher", () => {
        let openViewVaultItemPopoutSpy: jest.SpyInstance;

        beforeEach(() => {
          openViewVaultItemPopoutSpy = jest
            .spyOn(overlayBackground as any, "openViewVaultItemPopout")
            .mockImplementation();
        });

        it("returns early if the passed cipher ID does not match one of the overlay login ciphers", async () => {
          overlayBackground["overlayLoginCiphers"] = new Map([
            ["overlay-cipher-0", mock<CipherView>({ id: "overlay-cipher-0" })],
          ]);

          sendPortMessage(listPortSpy, {
            command: "viewSelectedCipher",
            overlayCipherId: "overlay-cipher-1",
          });
          await flushPromises();

          expect(openViewVaultItemPopoutSpy).not.toHaveBeenCalled();
        });

        it("will open the view vault item popout with the selected cipher", async () => {
          const cipher = mock<CipherView>({ id: "overlay-cipher-1" });
          overlayBackground["overlayLoginCiphers"] = new Map([
            ["overlay-cipher-0", mock<CipherView>({ id: "overlay-cipher-0" })],
            ["overlay-cipher-1", cipher],
          ]);

          sendPortMessage(listPortSpy, {
            command: "viewSelectedCipher",
            overlayCipherId: "overlay-cipher-1",
          });
          await flushPromises();

          expect(overlayBackground["openViewVaultItemPopout"]).toHaveBeenCalledWith(
            listPortSpy.sender.tab,
            {
              cipherId: cipher.id,
              action: SHOW_AUTOFILL_BUTTON,
            }
          );
        });
      });

      describe("redirectOverlayFocusOut", () => {
        it("redirects focus out of the overlay list", async () => {
          const message = {
            command: "redirectOverlayFocusOut",
            direction: RedirectFocusDirection.Next,
          };
          const redirectOverlayFocusOutSpy = jest.spyOn(
            overlayBackground as any,
            "redirectOverlayFocusOut"
          );

          sendPortMessage(listPortSpy, message);
          await flushPromises();

          expect(redirectOverlayFocusOutSpy).toHaveBeenCalledWith(message, listPortSpy);
        });
      });
    });
  });
});
