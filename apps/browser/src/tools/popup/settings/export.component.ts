import { Component } from "@angular/core";
import { UntypedFormBuilder } from "@angular/forms";
import { Router } from "@angular/router";

import { ExportComponent as BaseExportComponent } from "@bitwarden/angular/tools/export/components/export.component";
import { EventCollectionService } from "@bitwarden/common/abstractions/event/event-collection.service";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { UserVerificationService } from "@bitwarden/common/auth/abstractions/user-verification/user-verification.service.abstraction";
import { FileDownloadService } from "@bitwarden/common/platform/abstractions/file-download/file-download.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { DialogService } from "@bitwarden/components";
import { VaultExportServiceAbstraction } from "@bitwarden/exporter/vault-export";

@Component({
  selector: "app-export",
  templateUrl: "export.component.html",
})
export class ExportComponent extends BaseExportComponent {
  constructor(
    i18nService: I18nService,
    platformUtilsService: PlatformUtilsService,
    exportService: VaultExportServiceAbstraction,
    eventCollectionService: EventCollectionService,
    policyService: PolicyService,
    private router: Router,
    logService: LogService,
    userVerificationService: UserVerificationService,
    formBuilder: UntypedFormBuilder,
    fileDownloadService: FileDownloadService,
    dialogService: DialogService,
    organizationService: OrganizationService,
  ) {
    super(
      i18nService,
      platformUtilsService,
      exportService,
      eventCollectionService,
      policyService,
      logService,
      userVerificationService,
      formBuilder,
      fileDownloadService,
      dialogService,
      organizationService,
    );
  }

  protected saved() {
    super.saved();
    this.router.navigate(["/tabs/settings"]);
  }
}
