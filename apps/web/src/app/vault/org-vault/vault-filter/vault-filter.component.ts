import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { firstValueFrom, Subject } from "rxjs";

import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { TreeNode } from "@bitwarden/common/vault/models/domain/tree-node";

import { VaultFilterComponent as BaseVaultFilterComponent } from "../../individual-vault/vault-filter/components/vault-filter.component"; //../../vault/vault-filter/components/vault-filter.component";
import {
  VaultFilterList,
  VaultFilterType,
} from "../../individual-vault/vault-filter/shared/models/vault-filter-section.type";
import { CollectionFilter } from "../../individual-vault/vault-filter/shared/models/vault-filter.type";

@Component({
  selector: "app-organization-vault-filter",
  templateUrl: "../../individual-vault/vault-filter/components/vault-filter.component.html",
})
export class VaultFilterComponent extends BaseVaultFilterComponent implements OnInit, OnDestroy {
  @Input() set organization(value: Organization) {
    if (value && value !== this._organization) {
      this._organization = value;
      this.vaultFilterService.setOrganizationFilter(this._organization);
    }
  }
  _organization: Organization;
  protected destroy$: Subject<void>;

  async ngOnInit() {
    this.filters = await this.buildAllFilters();
    if (!this.activeFilter.selectedCipherTypeNode) {
      this.activeFilter.resetFilter();
      this.activeFilter.selectedCollectionNode =
        (await this.getDefaultFilter()) as TreeNode<CollectionFilter>;
    }
    this.isLoaded = true;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async buildAllFilters(): Promise<VaultFilterList> {
    const builderFilter = {} as VaultFilterList;
    builderFilter.typeFilter = await this.addTypeFilter(["favorites"]);
    builderFilter.collectionFilter = await this.addCollectionFilter();
    builderFilter.trashFilter = await this.addTrashFilter();
    return builderFilter;
  }

  async getDefaultFilter(): Promise<TreeNode<VaultFilterType>> {
    return await firstValueFrom(this.filters?.collectionFilter.data$);
  }
}
