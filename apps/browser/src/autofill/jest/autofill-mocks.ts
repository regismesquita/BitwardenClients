import { mock } from "jest-mock-extended";

import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { UriMatchType, CipherType } from "@bitwarden/common/vault/enums";
import { CipherRepromptType } from "@bitwarden/common/vault/enums/cipher-reprompt-type";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";

import { OverlayCipherData } from "../background/abstractions/overlay.background";
import AutofillField from "../models/autofill-field";
import AutofillPageDetails from "../models/autofill-page-details";
import AutofillScript, { FillScript } from "../models/autofill-script";
import { InitAutofillOverlayButtonMessage } from "../overlay/abstractions/autofill-overlay-button";
import { InitAutofillOverlayListMessage } from "../overlay/abstractions/autofill-overlay-list";
import { GenerateFillScriptOptions, PageDetail } from "../services/abstractions/autofill.service";

function createAutofillFieldMock(customFields = {}): AutofillField {
  return {
    opid: "default-input-field-opid",
    elementNumber: 0,
    viewable: true,
    htmlID: "default-htmlID",
    htmlName: "default-htmlName",
    htmlClass: "default-htmlClass",
    tabindex: "0",
    title: "default-title",
    "label-left": "default-label-left",
    "label-right": "default-label-right",
    "label-top": "default-label-top",
    "label-tag": "default-label-tag",
    "label-aria": "default-label-aria",
    placeholder: "default-placeholder",
    type: "text",
    value: "default-value",
    disabled: false,
    readonly: false,
    onePasswordFieldType: "",
    form: "invalidFormId",
    autoCompleteType: "off",
    selectInfo: "",
    maxLength: 0,
    tagName: "input",
    ...customFields,
  };
}

function createPageDetailMock(customFields = {}): PageDetail {
  return {
    frameId: 0,
    tab: createChromeTabMock(),
    details: createAutofillPageDetailsMock(),
    ...customFields,
  };
}

function createAutofillPageDetailsMock(customFields = {}): AutofillPageDetails {
  return {
    title: "title",
    url: "url",
    documentUrl: "documentUrl",
    forms: {
      validFormId: {
        opid: "opid",
        htmlName: "htmlName",
        htmlID: "htmlID",
        htmlAction: "htmlAction",
        htmlMethod: "htmlMethod",
      },
    },
    fields: [createAutofillFieldMock({ opid: "non-password-field" })],
    collectedTimestamp: 0,
    ...customFields,
  };
}

function createChromeTabMock(customFields = {}): chrome.tabs.Tab {
  return {
    id: 1,
    index: 1,
    pinned: false,
    highlighted: false,
    windowId: 2,
    active: true,
    incognito: false,
    selected: true,
    discarded: false,
    autoDiscardable: false,
    groupId: 2,
    url: "https://jest-testing-website.com",
    ...customFields,
  };
}

function createGenerateFillScriptOptionsMock(customFields = {}): GenerateFillScriptOptions {
  return {
    skipUsernameOnlyFill: false,
    onlyEmptyFields: false,
    onlyVisibleFields: false,
    fillNewPassword: false,
    allowTotpAutofill: false,
    cipher: mock<CipherView>(),
    tabUrl: "https://jest-testing-website.com",
    defaultUriMatch: UriMatchType.Domain,
    ...customFields,
  };
}

function createAutofillScriptMock(
  customFields = {},
  scriptTypes?: Record<string, string>
): AutofillScript {
  let script: FillScript[] = [
    ["click_on_opid", "default-field"],
    ["focus_by_opid", "default-field"],
    ["fill_by_opid", "default-field", "default"],
  ];
  if (scriptTypes) {
    script = [];
    for (const scriptType in scriptTypes) {
      script.push(["click_on_opid", scriptType]);
      script.push(["focus_by_opid", scriptType]);
      script.push(["fill_by_opid", scriptType, scriptTypes[scriptType]]);
    }
  }

  return {
    autosubmit: null,
    metadata: {},
    properties: {
      delay_between_operations: 20,
    },
    savedUrls: [],
    script,
    itemType: "",
    untrustedIframe: false,
    ...customFields,
  };
}

const overlayPagesTranslations = {
  locale: "en",
  buttonPageTitle: "buttonPageTitle",
  listPageTitle: "listPageTitle",
  opensInANewWindow: "opensInANewWindow",
  toggleBitwardenVaultOverlay: "toggleBitwardenVaultOverlay",
  unlockYourAccount: "unlockYourAccount",
  unlockAccount: "unlockAccount",
  fillCredentialsFor: "fillCredentialsFor",
  partialUsername: "partialUsername",
  view: "view",
  noItemsToShow: "noItemsToShow",
  newItem: "newItem",
  addNewVaultItem: "addNewVaultItem",
};
function createInitAutofillOverlayButtonMessageMock(
  customFields = {}
): InitAutofillOverlayButtonMessage {
  return {
    command: "initAutofillOverlayButton",
    translations: overlayPagesTranslations,
    styleSheetUrl: "https://jest-testing-website.com",
    authStatus: AuthenticationStatus.Unlocked,
    ...customFields,
  };
}
function createAutofillOverlayCipherDataMock(index: number, customFields = {}): OverlayCipherData {
  return {
    id: String(index),
    name: `website login ${index}`,
    login: { username: `username${index}` },
    type: CipherType.Login,
    reprompt: CipherRepromptType.None,
    favorite: false,
    icon: {
      imageEnabled: true,
      image: "https://jest-testing-website.com/image.png",
      fallbackImage: "https://jest-testing-website.com/fallback.png",
      icon: "bw-icon",
    },
    ...customFields,
  };
}

function createInitAutofillOverlayListMessageMock(
  customFields = {}
): InitAutofillOverlayListMessage {
  return {
    command: "initAutofillOverlayList",
    translations: overlayPagesTranslations,
    styleSheetUrl: "https://jest-testing-website.com",
    theme: "light",
    authStatus: AuthenticationStatus.Unlocked,
    ciphers: [
      createAutofillOverlayCipherDataMock(1, {
        icon: {
          imageEnabled: true,
          image: "https://jest-testing-website.com/image.png",
          fallbackImage: "",
          icon: "bw-icon",
        },
      }),
      createAutofillOverlayCipherDataMock(2, {
        icon: {
          imageEnabled: true,
          image: "",
          fallbackImage: "https://jest-testing-website.com/fallback.png",
          icon: "bw-icon",
        },
      }),
      createAutofillOverlayCipherDataMock(3, {
        name: "",
        login: { username: "" },
        icon: { imageEnabled: true, image: "", fallbackImage: "", icon: "bw-icon" },
      }),
      createAutofillOverlayCipherDataMock(4, {
        icon: { imageEnabled: false, image: "", fallbackImage: "", icon: "" },
      }),
      createAutofillOverlayCipherDataMock(5),
      createAutofillOverlayCipherDataMock(6),
      createAutofillOverlayCipherDataMock(7),
      createAutofillOverlayCipherDataMock(8),
    ],
    ...customFields,
  };
}

function createFocusedFieldDataMock(customFields = {}) {
  return {
    focusedFieldRects: {
      top: 1,
      left: 2,
      height: 3,
      width: 4,
    },
    focusedFieldStyles: {
      paddingRight: "6px",
      paddingLeft: "6px",
    },
    ...customFields,
  };
}

function createPortSpyMock(name: string) {
  return mock<chrome.runtime.Port>({
    name,
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onDisconnect: {
      addListener: jest.fn(),
    },
    postMessage: jest.fn(),
    sender: {
      tab: createChromeTabMock(),
    },
  });
}

export {
  createAutofillFieldMock,
  createPageDetailMock,
  createAutofillPageDetailsMock,
  createChromeTabMock,
  createGenerateFillScriptOptionsMock,
  createAutofillScriptMock,
  createInitAutofillOverlayButtonMessageMock,
  createInitAutofillOverlayListMessageMock,
  createFocusedFieldDataMock,
  createPortSpyMock,
};
