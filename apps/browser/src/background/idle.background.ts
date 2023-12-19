import { firstValueFrom } from "rxjs";

import { NotificationsService } from "@bitwarden/common/abstractions/notifications.service";
import { VaultTimeoutService } from "@bitwarden/common/abstractions/vault-timeout/vault-timeout.service";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { VaultTimeoutAction } from "@bitwarden/common/enums/vault-timeout-action.enum";

import { BrowserStateService } from "../platform/services/abstractions/browser-state.service";

const IdleInterval = 60 * 5; // 5 minutes

export default class IdleBackground {
  private idle: typeof chrome.idle | typeof browser.idle | null;
  private idleTimer: number = null;
  private idleState = "active";

  constructor(
    private vaultTimeoutService: VaultTimeoutService,
    private stateService: BrowserStateService,
    private notificationsService: NotificationsService,
    private accountService: AccountService,
  ) {
    this.idle = chrome.idle || (browser != null ? browser.idle : null);
  }

  async init() {
    if (!this.idle) {
      return;
    }

    const idleHandler = (newState: string) => {
      if (newState === "active") {
        this.notificationsService.reconnectFromActivity();
      } else {
        this.notificationsService.disconnectFromInactivity();
      }
    };
    if (this.idle.onStateChanged && this.idle.setDetectionInterval) {
      this.idle.setDetectionInterval(IdleInterval);
      this.idle.onStateChanged.addListener(idleHandler);
    } else {
      this.pollIdle(idleHandler);
    }

    if (this.idle.onStateChanged) {
      this.idle.onStateChanged.addListener(
        async (newState: chrome.idle.IdleState | browser.idle.IdleState) => {
          if (newState === "locked") {
            // Need to check if any of the current users have their timeout set to `onLocked`
            const allUsers = await firstValueFrom(this.accountService.accounts$);
            for (const userId in allUsers) {
              // If the screen is locked or the screensaver activates
              const timeout = await this.stateService.getVaultTimeout({ userId: userId });
              if (timeout === -2) {
                // On System Lock vault timeout option
                const action = await this.stateService.getVaultTimeoutAction({ userId: userId });
                if (action === VaultTimeoutAction.LogOut) {
                  await this.vaultTimeoutService.logOut(userId);
                } else {
                  await this.vaultTimeoutService.lock(userId);
                }
              }
            }
          }
        },
      );
    }
  }

  private pollIdle(handler: (newState: string) => void) {
    if (this.idleTimer != null) {
      window.clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    this.idle.queryState(IdleInterval, (state: string) => {
      if (state !== this.idleState) {
        this.idleState = state;
        handler(state);
      }
      this.idleTimer = window.setTimeout(() => this.pollIdle(handler), 5000);
    });
  }
}
