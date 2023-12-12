import { Component, Input } from "@angular/core";

import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { FileDownloadService } from "@bitwarden/common/platform/abstractions/file-download/file-download.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { EncArrayBuffer } from "@bitwarden/common/platform/models/domain/enc-array-buffer";
import { SymmetricCryptoKey } from "@bitwarden/common/platform/models/domain/symmetric-crypto-key";
import { SendAccessRequest } from "@bitwarden/common/tools/send/models/request/send-access.request";
import { SendAccessView } from "@bitwarden/common/tools/send/models/view/send-access.view";
import { SendApiService } from "@bitwarden/common/tools/send/services/send-api.service.abstraction";

import { SharedModule } from "../../shared";

@Component({
  selector: "app-send-access-file",
  templateUrl: "send-access-file.component.html",
  imports: [SharedModule],
  standalone: true,
})
export class SendAccessFileComponent {
  @Input() send: SendAccessView;
  @Input() decKey: SymmetricCryptoKey;
  @Input() accessRequest: SendAccessRequest;
  constructor(
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService,
    private cryptoService: CryptoService,
    private fileDownloadService: FileDownloadService,
    private sendApiService: SendApiService
  ) {}

  protected download = async () => {
    if (this.send == null || this.decKey == null) {
      return;
    }

    const downloadData = await this.sendApiService.getSendFileDownloadData(
      this.send,
      this.accessRequest
    );

    if (Utils.isNullOrWhitespace(downloadData.url)) {
      this.platformUtilsService.showToast("error", null, this.i18nService.t("missingSendFile"));
      return;
    }

    const response = await fetch(new Request(downloadData.url, { cache: "no-store" }));
    if (response.status !== 200) {
      this.platformUtilsService.showToast("error", null, this.i18nService.t("errorOccurred"));
      return;
    }

    try {
      const encBuf = await EncArrayBuffer.fromResponse(response);
      const decBuf = await this.cryptoService.decryptFromBytes(encBuf, this.decKey);
      this.fileDownloadService.download({
        fileName: this.send.file.fileName,
        blobData: decBuf,
        downloadMethod: "save",
      });
    } catch (e) {
      this.platformUtilsService.showToast("error", null, this.i18nService.t("errorOccurred"));
    }
  };
}
