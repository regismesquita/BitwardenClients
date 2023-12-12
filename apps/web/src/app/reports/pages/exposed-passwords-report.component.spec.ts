// eslint-disable-next-line no-restricted-imports
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { mock, MockProxy } from "jest-mock-extended";

import { I18nPipe } from "@bitwarden/angular/platform/pipes/i18n.pipe";
import { ModalService } from "@bitwarden/angular/services/modal.service";
import { AuditService } from "@bitwarden/common/abstractions/audit.service";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { PasswordRepromptService } from "@bitwarden/vault";

import { ExposedPasswordsReportComponent } from "./exposed-passwords-report.component";
import { cipherData } from "./reports-ciphers.mock";

describe("ExposedPasswordsReportComponent", () => {
  let component: ExposedPasswordsReportComponent;
  let fixture: ComponentFixture<ExposedPasswordsReportComponent>;
  let auditService: MockProxy<AuditService>;

  beforeEach(() => {
    auditService = mock<AuditService>();
    TestBed.configureTestingModule({
      declarations: [ExposedPasswordsReportComponent, I18nPipe],
      providers: [
        {
          provide: CipherService,
          useValue: mock<CipherService>(),
        },
        {
          provide: AuditService,
          useValue: auditService,
        },
        {
          provide: OrganizationService,
          useValue: mock<OrganizationService>(),
        },
        {
          provide: ModalService,
          useValue: mock<ModalService>(),
        },
        {
          provide: PasswordRepromptService,
          useValue: mock<PasswordRepromptService>(),
        },
        {
          provide: I18nService,
          useValue: mock<I18nService>(),
        },
      ],
      schemas: [],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExposedPasswordsReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should initialize component", () => {
    expect(component).toBeTruthy();
  });

  it('should get only ciphers with exposed passwords that the user has "Can Edit" access to', async () => {
    const expectedIdOne: any = "cbea34a8-bde4-46ad-9d19-b05001228ab2";
    const expectedIdTwo = "cbea34a8-bde4-46ad-9d19-b05001228cd3";

    jest.spyOn(auditService, "passwordLeaked").mockReturnValue(Promise.resolve<any>(1234));
    jest.spyOn(component as any, "getAllCiphers").mockReturnValue(Promise.resolve<any>(cipherData));
    await component.setCiphers();

    expect(component.ciphers.length).toEqual(2);
    expect(component.ciphers[0].id).toEqual(expectedIdOne);
    expect(component.ciphers[0].edit).toEqual(true);
    expect(component.ciphers[1].id).toEqual(expectedIdTwo);
    expect(component.ciphers[1].edit).toEqual(true);
  });
});
