import { VaultFilter } from "@bitwarden/angular/vault/vault-filter/models/vault-filter.model";
import { VaultFilterService as BaseVaultFilterService } from "@bitwarden/angular/vault/vault-filter/services/vault-filter.service";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CollectionService } from "@bitwarden/common/vault/abstractions/collection.service";
import { FolderService } from "@bitwarden/common/vault/abstractions/folder/folder.service.abstraction";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";

export class VaultFilterService extends BaseVaultFilterService {
  vaultFilter: VaultFilter = new VaultFilter();

  allVaults = "allVaults";
  myVault = "myVault";

  constructor(
    stateService: StateService,
    organizationService: OrganizationService,
    folderService: FolderService,
    cipherService: CipherService,
    collectionService: CollectionService,
    policyService: PolicyService,
    private accountService: AccountService,
  ) {
    super(
      stateService,
      organizationService,
      folderService,
      cipherService,
      collectionService,
      policyService
    );
    this.vaultFilter.myVaultOnly = false;
    this.vaultFilter.selectedOrganizationId = null;

    this.accountService.activeAccount$.subscribe((account) => {
      this.setVaultFilter(this.allVaults);
    });
  }

  getVaultFilter() {
    return this.vaultFilter;
  }

  setVaultFilter(filter: string) {
    if (filter === this.allVaults) {
      this.vaultFilter.myVaultOnly = false;
      this.vaultFilter.selectedOrganizationId = null;
    } else if (filter === this.myVault) {
      this.vaultFilter.myVaultOnly = true;
      this.vaultFilter.selectedOrganizationId = null;
    } else {
      this.vaultFilter.myVaultOnly = false;
      this.vaultFilter.selectedOrganizationId = filter;
    }
  }

  clear() {
    this.setVaultFilter(this.allVaults);
  }

  filterCipherForSelectedVault(cipher: CipherView) {
    if (!this.vaultFilter.selectedOrganizationId && !this.vaultFilter.myVaultOnly) {
      return false;
    }
    if (this.vaultFilter.selectedOrganizationId) {
      if (cipher.organizationId === this.vaultFilter.selectedOrganizationId) {
        return false;
      }
    } else if (this.vaultFilter.myVaultOnly) {
      if (!cipher.organizationId) {
        return false;
      }
    }
    return true;
  }
}
