import { mock, MockProxy } from "jest-mock-extended";

import { EventCollectionService } from "@bitwarden/common/abstractions/event/event-collection.service";
import { TotpService } from "@bitwarden/common/abstractions/totp.service";
import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { UserVerificationService } from "@bitwarden/common/auth/abstractions/user-verification/user-verification.service.abstraction";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CipherRepromptType } from "@bitwarden/common/vault/enums/cipher-reprompt-type";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";
import { Cipher } from "@bitwarden/common/vault/models/domain/cipher";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";

import {
  AUTOFILL_ID,
  COPY_PASSWORD_ID,
  COPY_USERNAME_ID,
  COPY_VERIFICATIONCODE_ID,
  GENERATE_PASSWORD_ID,
  NOOP_COMMAND_SUFFIX,
} from "../constants";

import {
  CopyToClipboardAction,
  ContextMenuClickedHandler,
  CopyToClipboardOptions,
  GeneratePasswordToClipboardAction,
  AutofillAction,
} from "./context-menu-clicked-handler";

describe("ContextMenuClickedHandler", () => {
  const createData = (
    menuItemId: chrome.contextMenus.OnClickData["menuItemId"],
    parentMenuItemId?: chrome.contextMenus.OnClickData["parentMenuItemId"]
  ): chrome.contextMenus.OnClickData => {
    return {
      menuItemId: menuItemId,
      parentMenuItemId: parentMenuItemId,
      editable: false,
      pageUrl: "something",
    };
  };

  const createCipher = (data?: {
    id?: CipherView["id"];
    username?: CipherView["login"]["username"];
    password?: CipherView["login"]["password"];
    totp?: CipherView["login"]["totp"];
  }): CipherView => {
    const { id, username, password, totp } = data || {};
    const cipherView = new CipherView(
      new Cipher({
        id: id ?? "1",
        type: CipherType.Login,
      } as any)
    );

    cipherView.login.username = username ?? "USERNAME";
    cipherView.login.password = password ?? "PASSWORD";
    cipherView.login.totp = totp ?? "TOTP";
    return cipherView;
  };

  let copyToClipboard: CopyToClipboardAction;
  let generatePasswordToClipboard: GeneratePasswordToClipboardAction;
  let autofill: AutofillAction;
  let authService: MockProxy<AuthService>;
  let cipherService: MockProxy<CipherService>;
  let stateService: MockProxy<StateService>;
  let totpService: MockProxy<TotpService>;
  let eventCollectionService: MockProxy<EventCollectionService>;
  let userVerificationService: MockProxy<UserVerificationService>;

  let sut: ContextMenuClickedHandler;

  beforeEach(() => {
    copyToClipboard = jest.fn<void, [CopyToClipboardOptions]>();
    generatePasswordToClipboard = jest.fn<Promise<void>, [tab: chrome.tabs.Tab]>();
    autofill = jest.fn<Promise<void>, [tab: chrome.tabs.Tab, cipher: CipherView]>();
    authService = mock();
    cipherService = mock();
    stateService = mock();
    totpService = mock();
    eventCollectionService = mock();

    sut = new ContextMenuClickedHandler(
      copyToClipboard,
      generatePasswordToClipboard,
      autofill,
      authService,
      cipherService,
      stateService,
      totpService,
      eventCollectionService,
      userVerificationService
    );
  });

  afterEach(() => jest.resetAllMocks());

  describe("run", () => {
    it("can generate password", async () => {
      await sut.run(createData(GENERATE_PASSWORD_ID), { id: 5 } as any);

      expect(generatePasswordToClipboard).toBeCalledTimes(1);

      expect(generatePasswordToClipboard).toBeCalledWith({
        id: 5,
      });
    });

    it("attempts to autofill the correct cipher", async () => {
      const cipher = createCipher();
      cipherService.getAllDecrypted.mockResolvedValue([cipher]);

      await sut.run(createData(`${AUTOFILL_ID}_1`, AUTOFILL_ID), { id: 5 } as any);

      expect(autofill).toBeCalledTimes(1);

      expect(autofill).toBeCalledWith({ id: 5 }, cipher);
    });

    it("copies username to clipboard", async () => {
      cipherService.getAllDecrypted.mockResolvedValue([
        createCipher({ username: "TEST_USERNAME" }),
      ]);

      await sut.run(createData(`${COPY_USERNAME_ID}_1`, COPY_USERNAME_ID), {
        url: "https://test.com",
      } as any);

      expect(copyToClipboard).toBeCalledTimes(1);

      expect(copyToClipboard).toHaveBeenCalledWith({
        text: "TEST_USERNAME",
        tab: { url: "https://test.com" },
      });
    });

    it("copies password to clipboard", async () => {
      cipherService.getAllDecrypted.mockResolvedValue([
        createCipher({ password: "TEST_PASSWORD" }),
      ]);

      await sut.run(createData(`${COPY_PASSWORD_ID}_1`, COPY_PASSWORD_ID), {
        url: "https://test.com",
      } as any);

      expect(copyToClipboard).toBeCalledTimes(1);

      expect(copyToClipboard).toHaveBeenCalledWith({
        text: "TEST_PASSWORD",
        tab: { url: "https://test.com" },
      });
    });

    it("copies totp code to clipboard", async () => {
      cipherService.getAllDecrypted.mockResolvedValue([createCipher({ totp: "TEST_TOTP_SEED" })]);

      totpService.getCode.mockImplementation((seed) => {
        if (seed === "TEST_TOTP_SEED") {
          return Promise.resolve("123456");
        }

        return Promise.resolve("654321");
      });

      await sut.run(createData(`${COPY_VERIFICATIONCODE_ID}_1`, COPY_VERIFICATIONCODE_ID), {
        url: "https://test.com",
      } as any);

      expect(totpService.getCode).toHaveBeenCalledTimes(1);

      expect(copyToClipboard).toHaveBeenCalledWith({
        text: "123456",
        tab: { url: "https://test.com" },
      });
    });

    it("attempts to find a cipher when noop but unlocked", async () => {
      cipherService.getAllDecryptedForUrl.mockResolvedValue([
        {
          ...createCipher({ username: "NOOP_USERNAME" }),
          reprompt: CipherRepromptType.None,
        } as any,
      ]);

      await sut.run(createData(`${COPY_USERNAME_ID}_${NOOP_COMMAND_SUFFIX}`, COPY_USERNAME_ID), {
        url: "https://test.com",
      } as any);

      expect(cipherService.getAllDecryptedForUrl).toHaveBeenCalledTimes(1);

      expect(cipherService.getAllDecryptedForUrl).toHaveBeenCalledWith("https://test.com", []);

      expect(copyToClipboard).toHaveBeenCalledTimes(1);

      expect(copyToClipboard).toHaveBeenCalledWith({
        text: "NOOP_USERNAME",
        tab: { url: "https://test.com" },
      });
    });

    it("attempts to find a cipher when noop but unlocked", async () => {
      cipherService.getAllDecryptedForUrl.mockResolvedValue([
        {
          ...createCipher({ username: "NOOP_USERNAME" }),
          reprompt: CipherRepromptType.Password,
        } as any,
      ]);

      await sut.run(createData(`${COPY_USERNAME_ID}_${NOOP_COMMAND_SUFFIX}`, COPY_USERNAME_ID), {
        url: "https://test.com",
      } as any);

      expect(cipherService.getAllDecryptedForUrl).toHaveBeenCalledTimes(1);

      expect(cipherService.getAllDecryptedForUrl).toHaveBeenCalledWith("https://test.com", []);
    });
  });
});
