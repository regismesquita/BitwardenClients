import { Component, OnDestroy } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Subject, takeUntil } from "rxjs";

import { FileDownloadService } from "@bitwarden/common/platform/abstractions/file-download/file-download.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { BaseEventsComponent } from "@bitwarden/web-vault/app/admin-console/common/base.events.component";
import { EventService } from "@bitwarden/web-vault/app/core";
import { EventExportService } from "@bitwarden/web-vault/app/tools/event-export";

import { ServiceAccountEventLogApiService } from "./service-account-event-log-api.service";

@Component({
  selector: "sm-service-accounts-events",
  templateUrl: "./service-accounts-events.component.html",
})
export class ServiceAccountEventsComponent extends BaseEventsComponent implements OnDestroy {
  exportFileName = "service-account-events";
  private destroy$ = new Subject<void>();
  private serviceAccountId: string;

  constructor(
    eventService: EventService,
    private serviceAccountEventsApiService: ServiceAccountEventLogApiService,
    private route: ActivatedRoute,
    i18nService: I18nService,
    exportService: EventExportService,
    platformUtilsService: PlatformUtilsService,
    logService: LogService,
    fileDownloadService: FileDownloadService
  ) {
    super(
      eventService,
      i18nService,
      exportService,
      platformUtilsService,
      logService,
      fileDownloadService
    );
  }

  async ngOnInit() {
    // eslint-disable-next-line rxjs/no-async-subscribe
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(async (params) => {
      this.serviceAccountId = params.serviceAccountId;
      await this.load();
    });
  }

  async load() {
    await this.loadEvents(true);
    this.loaded = true;
  }

  protected requestEvents(startDate: string, endDate: string, continuationToken: string) {
    return this.serviceAccountEventsApiService.getEvents(
      this.serviceAccountId,
      startDate,
      endDate,
      continuationToken
    );
  }

  protected getUserName() {
    return {
      name: this.i18nService.t("serviceAccount") + " " + this.serviceAccountId,
      email: "",
    };
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
