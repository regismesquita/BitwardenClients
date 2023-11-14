import { Directive, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { firstValueFrom, map, Observable, Subject, takeUntil } from "rxjs";

import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { OrganizationUserStatusType } from "@bitwarden/common/admin-console/enums";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { Checkable, isChecked } from "@bitwarden/common/types/checkable";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CollectionService } from "@bitwarden/common/vault/abstractions/collection.service";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { CollectionView } from "@bitwarden/common/vault/models/view/collection.view";

@Directive()
export class ShareComponent implements OnInit, OnDestroy {
  @Input() cipherId: string;
  @Input() organizationId: string;
  @Output() onSharedCipher = new EventEmitter();

  formPromise: Promise<void>;
  cipher: CipherView;
  collections: Checkable<CollectionView>[] = [];
  organizations$: Observable<Organization[]>;

  protected writeableCollections: Checkable<CollectionView>[] = [];

  private _destroy = new Subject<void>();

  constructor(
    protected collectionService: CollectionService,
    protected platformUtilsService: PlatformUtilsService,
    protected i18nService: I18nService,
    protected cipherService: CipherService,
    private logService: LogService,
    protected organizationService: OrganizationService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  ngOnDestroy(): void {
    this._destroy.next();
    this._destroy.complete();
  }

  async load() {
    const allCollections = await this.collectionService.getAllDecrypted();
    this.writeableCollections = allCollections.map((c) => c).filter((c) => !c.readOnly);

    this.organizations$ = this.organizationService.memberOrganizations$.pipe(
      map((orgs) => {
        return orgs
          .filter((o) => o.enabled && o.status === OrganizationUserStatusType.Confirmed)
          .sort(Utils.getSortFunction(this.i18nService, "name"));
      })
    );

    this.organizations$.pipe(takeUntil(this._destroy)).subscribe((orgs) => {
      if (this.organizationId == null && orgs.length > 0) {
        this.organizationId = orgs[0].id;
      }
    });

    const cipherDomain = await this.cipherService.get(this.cipherId);
    this.cipher = await cipherDomain.decrypt(
      await this.cipherService.getKeyForCipherKeyDecryption(cipherDomain)
    );

    this.filterCollections();
  }

  filterCollections() {
    this.writeableCollections.forEach((c) => (c.checked = false));
    if (this.organizationId == null || this.writeableCollections.length === 0) {
      this.collections = [];
    } else {
      this.collections = this.writeableCollections.filter(
        (c) => c.organizationId === this.organizationId
      );
    }
  }

  async submit(): Promise<boolean> {
    const selectedCollectionIds = this.collections.filter(isChecked).map((c) => c.id);
    if (selectedCollectionIds.length === 0) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("selectOneCollection")
      );
      return;
    }

    const cipherDomain = await this.cipherService.get(this.cipherId);
    const cipherView = await cipherDomain.decrypt(
      await this.cipherService.getKeyForCipherKeyDecryption(cipherDomain)
    );
    const orgs = await firstValueFrom(this.organizations$);
    const orgName =
      orgs.find((o) => o.id === this.organizationId)?.name ?? this.i18nService.t("organization");

    try {
      this.formPromise = this.cipherService
        .shareWithServer(cipherView, this.organizationId, selectedCollectionIds)
        .then(async () => {
          this.onSharedCipher.emit();
          this.platformUtilsService.showToast(
            "success",
            null,
            this.i18nService.t("movedItemToOrg", cipherView.name, orgName)
          );
        });
      await this.formPromise;
      return true;
    } catch (e) {
      this.logService.error(e);
    }
    return false;
  }

  get canSave() {
    if (this.collections != null) {
      for (let i = 0; i < this.collections.length; i++) {
        if (this.collections[i].checked) {
          return true;
        }
      }
    }
    return false;
  }
}
