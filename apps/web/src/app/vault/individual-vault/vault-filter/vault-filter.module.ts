import { NgModule } from "@angular/core";

import { VaultFilterSharedModule } from "../../individual-vault/vault-filter/shared/vault-filter-shared.module";

import { LinkSsoDirective } from "./components/link-sso.directive";
import { OrganizationOptionsComponent } from "./components/organization-options.component";
import { VaultFilterComponent } from "./components/vault-filter.component";
import { VaultFilterService as VaultFilterServiceAbstraction } from "./services/abstractions/vault-filter.service";
import { VaultFilterService } from "./services/vault-filter.service";

@NgModule({
  imports: [VaultFilterSharedModule],
  declarations: [VaultFilterComponent, OrganizationOptionsComponent, LinkSsoDirective],
  exports: [VaultFilterComponent],
  providers: [
    {
      provide: VaultFilterServiceAbstraction,
      useClass: VaultFilterService,
    },
  ],
})
export class VaultFilterModule {}
