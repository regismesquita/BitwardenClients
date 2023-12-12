import { Component, NgZone, OnDestroy, ViewChild, ViewContainerRef } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";

import { EnvironmentSelectorComponent } from "@bitwarden/angular/auth/components/environment-selector.component";
import { LoginComponent as BaseLoginComponent } from "@bitwarden/angular/auth/components/login.component";
import { FormValidationErrorsService } from "@bitwarden/angular/platform/abstractions/form-validation-errors.service";
import { ModalService } from "@bitwarden/angular/services/modal.service";
import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { DevicesApiServiceAbstraction } from "@bitwarden/common/auth/abstractions/devices-api.service.abstraction";
import { LoginService } from "@bitwarden/common/auth/abstractions/login.service";
import { WebAuthnLoginServiceAbstraction } from "@bitwarden/common/auth/abstractions/webauthn/webauthn-login.service.abstraction";
import { AppIdService } from "@bitwarden/common/platform/abstractions/app-id.service";
import { BroadcasterService } from "@bitwarden/common/platform/abstractions/broadcaster.service";
import { CryptoFunctionService } from "@bitwarden/common/platform/abstractions/crypto-function.service";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { PasswordGenerationServiceAbstraction } from "@bitwarden/common/tools/generator/password";
import { SyncService } from "@bitwarden/common/vault/abstractions/sync/sync.service.abstraction";

import { EnvironmentComponent } from "../environment.component";

const BroadcasterSubscriptionId = "LoginComponent";

@Component({
  selector: "app-login",
  templateUrl: "login.component.html",
})
export class LoginComponent extends BaseLoginComponent implements OnDestroy {
  @ViewChild("environment", { read: ViewContainerRef, static: true })
  environmentModal: ViewContainerRef;
  @ViewChild("environmentSelector", { read: ViewContainerRef, static: true })
  environmentSelector: EnvironmentSelectorComponent;

  protected componentDestroyed$: Subject<void> = new Subject();
  webVaultHostname = "";

  showingModal = false;

  private deferFocus: boolean = null;

  get loggedEmail() {
    return this.formGroup.value.email;
  }

  get selfHostedDomain() {
    return this.environmentService.hasBaseUrl() ? this.environmentService.getWebVaultUrl() : null;
  }

  constructor(
    devicesApiService: DevicesApiServiceAbstraction,
    appIdService: AppIdService,
    authService: AuthService,
    router: Router,
    i18nService: I18nService,
    syncService: SyncService,
    private modalService: ModalService,
    platformUtilsService: PlatformUtilsService,
    stateService: StateService,
    environmentService: EnvironmentService,
    passwordGenerationService: PasswordGenerationServiceAbstraction,
    cryptoFunctionService: CryptoFunctionService,
    private broadcasterService: BroadcasterService,
    ngZone: NgZone,
    private messagingService: MessagingService,
    logService: LogService,
    formBuilder: FormBuilder,
    formValidationErrorService: FormValidationErrorsService,
    route: ActivatedRoute,
    loginService: LoginService,
    webAuthnLoginService: WebAuthnLoginServiceAbstraction
  ) {
    super(
      devicesApiService,
      appIdService,
      authService,
      router,
      platformUtilsService,
      i18nService,
      stateService,
      environmentService,
      passwordGenerationService,
      cryptoFunctionService,
      logService,
      ngZone,
      formBuilder,
      formValidationErrorService,
      route,
      loginService,
      webAuthnLoginService
    );
    super.onSuccessfulLogin = () => {
      return syncService.fullSync(true);
    };
  }

  async ngOnInit() {
    await super.ngOnInit();
    await this.getLoginWithDevice(this.loggedEmail);
    this.broadcasterService.subscribe(BroadcasterSubscriptionId, async (message: any) => {
      this.ngZone.run(() => {
        switch (message.command) {
          case "windowHidden":
            this.onWindowHidden();
            break;
          case "windowIsFocused":
            if (this.deferFocus === null) {
              this.deferFocus = !message.windowIsFocused;
              if (!this.deferFocus) {
                this.focusInput();
              }
            } else if (this.deferFocus && message.windowIsFocused) {
              this.focusInput();
              this.deferFocus = false;
            }
            break;
          default:
        }
      });
    });
    this.messagingService.send("getWindowIsFocused");
  }

  ngOnDestroy() {
    this.broadcasterService.unsubscribe(BroadcasterSubscriptionId);
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async settings() {
    const [modal, childComponent] = await this.modalService.openViewRef(
      EnvironmentComponent,
      this.environmentModal
    );

    modal.onShown.pipe(takeUntil(this.componentDestroyed$)).subscribe(() => {
      this.showingModal = true;
    });

    modal.onClosed.pipe(takeUntil(this.componentDestroyed$)).subscribe(() => {
      this.showingModal = false;
    });

    // eslint-disable-next-line rxjs/no-async-subscribe
    childComponent.onSaved.pipe(takeUntil(this.componentDestroyed$)).subscribe(async () => {
      modal.close();
      this.environmentSelector.updateEnvironmentInfo();
      await this.getLoginWithDevice(this.loggedEmail);
    });
  }

  onWindowHidden() {
    this.showPassword = false;
  }

  async continue() {
    await super.validateEmail();
    if (!this.formGroup.controls.email.valid) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccured"),
        this.i18nService.t("invalidEmail")
      );
      return;
    }
    this.focusInput();
  }

  async submit() {
    if (!this.validatedEmail) {
      return;
    }

    await super.submit();
    if (this.captchaSiteKey) {
      const content = document.getElementById("content") as HTMLDivElement;
      content.setAttribute("style", "width:335px");
    }
  }

  private focusInput() {
    const email = this.loggedEmail;
    document.getElementById(email == null || email === "" ? "email" : "masterPassword")?.focus();
  }
}
