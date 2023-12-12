import * as fs from "fs";
import * as path from "path";

import { ipcMain } from "electron";

import { I18nService as BaseI18nService } from "@bitwarden/common/platform/services/i18n.service";

export class I18nMainService extends BaseI18nService {
  constructor(systemLanguage: string, localesDirectory: string) {
    super(systemLanguage, localesDirectory, (formattedLocale: string) =>
      this.readLanguageFile(formattedLocale)
    );

    ipcMain.handle("getLanguageFile", async (event, formattedLocale: string) =>
      this.readLanguageFile(formattedLocale)
    );

    // Please leave 'en' where it is, as it's our fallback language in case no translation can be found
    this.supportedTranslationLocales = [
      "en",
      "af",
      "ar",
      "az",
      "be",
      "bg",
      "bn",
      "bs",
      "ca",
      "cs",
      "da",
      "de",
      "el",
      "en-GB",
      "en-IN",
      "eo",
      "es",
      "et",
      "eu",
      "fa",
      "fi",
      "fil",
      "fr",
      "he",
      "hi",
      "hr",
      "hu",
      "id",
      "it",
      "ja",
      "ka",
      "km",
      "kn",
      "ko",
      "lv",
      "me",
      "ml",
      "nb",
      "nl",
      "nn",
      "pl",
      "pt-BR",
      "pt-PT",
      "ro",
      "ru",
      "si",
      "sk",
      "sl",
      "sr",
      "sv",
      "th",
      "tr",
      "uk",
      "vi",
      "zh-CN",
      "zh-TW",
    ];
  }

  private readLanguageFile(formattedLocale: string): Promise<any> {
    // Check that the provided locale only contains letters and dashes and underscores to avoid possible path traversal
    if (!/^[a-zA-Z_-]+$/.test(formattedLocale)) {
      return Promise.resolve({});
    }

    const filePath = path.join(__dirname, this.localesDirectory, formattedLocale, "messages.json");
    const localesJson = fs.readFileSync(filePath, "utf8");
    const locales = JSON.parse(localesJson.replace(/^\uFEFF/, "")); // strip the BOM
    return Promise.resolve(locales);
  }
}
