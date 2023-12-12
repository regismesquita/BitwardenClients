import { mock } from "jest-mock-extended";
import { Jsonify } from "type-fest";

import { makeStaticByteArray, mockEnc, mockFromJson } from "../../../../spec/utils";
import { CryptoService } from "../../../platform/abstractions/crypto.service";
import { EncryptService } from "../../../platform/abstractions/encrypt.service";
import { EncString } from "../../../platform/models/domain/enc-string";
import { ContainerService } from "../../../platform/services/container.service";
import { InitializerKey } from "../../../platform/services/cryptography/initializer-key";
import { CipherService } from "../../abstractions/cipher.service";
import { FieldType, SecureNoteType, UriMatchType } from "../../enums";
import { CipherRepromptType } from "../../enums/cipher-reprompt-type";
import { CipherType } from "../../enums/cipher-type";
import { CipherData } from "../../models/data/cipher.data";
import { Attachment } from "../../models/domain/attachment";
import { Card } from "../../models/domain/card";
import { Cipher } from "../../models/domain/cipher";
import { Field } from "../../models/domain/field";
import { Identity } from "../../models/domain/identity";
import { Login } from "../../models/domain/login";
import { Password } from "../../models/domain/password";
import { SecureNote } from "../../models/domain/secure-note";
import { CardView } from "../../models/view/card.view";
import { IdentityView } from "../../models/view/identity.view";
import { LoginView } from "../../models/view/login.view";

describe("Cipher DTO", () => {
  it("Convert from empty CipherData", () => {
    const data = new CipherData();
    const cipher = new Cipher(data);

    expect(cipher).toEqual({
      initializerKey: InitializerKey.Cipher,
      id: null,
      organizationId: null,
      folderId: null,
      name: null,
      notes: null,
      type: undefined,
      favorite: undefined,
      organizationUseTotp: undefined,
      edit: undefined,
      viewPassword: true,
      revisionDate: null,
      collectionIds: undefined,
      localData: null,
      creationDate: null,
      deletedDate: null,
      reprompt: undefined,
      attachments: null,
      fields: null,
      passwordHistory: null,
      key: null,
    });
  });

  describe("LoginCipher", () => {
    let cipherData: CipherData;

    beforeEach(() => {
      cipherData = {
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        edit: true,
        viewPassword: true,
        organizationUseTotp: true,
        favorite: false,
        revisionDate: "2022-01-31T12:00:00.000Z",
        type: CipherType.Login,
        name: "EncryptedString",
        notes: "EncryptedString",
        creationDate: "2022-01-01T12:00:00.000Z",
        deletedDate: null,
        reprompt: CipherRepromptType.None,
        key: "EncryptedString",
        login: {
          uris: [{ uri: "EncryptedString", match: UriMatchType.Domain }],
          username: "EncryptedString",
          password: "EncryptedString",
          passwordRevisionDate: "2022-01-31T12:00:00.000Z",
          totp: "EncryptedString",
          autofillOnPageLoad: false,
        },
        passwordHistory: [
          { password: "EncryptedString", lastUsedDate: "2022-01-31T12:00:00.000Z" },
        ],
        attachments: [
          {
            id: "a1",
            url: "url",
            size: "1100",
            sizeName: "1.1 KB",
            fileName: "file",
            key: "EncKey",
          },
          {
            id: "a2",
            url: "url",
            size: "1100",
            sizeName: "1.1 KB",
            fileName: "file",
            key: "EncKey",
          },
        ],
        fields: [
          {
            name: "EncryptedString",
            value: "EncryptedString",
            type: FieldType.Text,
            linkedId: null,
          },
          {
            name: "EncryptedString",
            value: "EncryptedString",
            type: FieldType.Hidden,
            linkedId: null,
          },
        ],
      };
    });

    it("Convert", () => {
      const cipher = new Cipher(cipherData);

      expect(cipher).toEqual({
        initializerKey: InitializerKey.Cipher,
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        name: { encryptedString: "EncryptedString", encryptionType: 0 },
        notes: { encryptedString: "EncryptedString", encryptionType: 0 },
        type: 1,
        favorite: false,
        organizationUseTotp: true,
        edit: true,
        viewPassword: true,
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
        collectionIds: undefined,
        localData: null,
        creationDate: new Date("2022-01-01T12:00:00.000Z"),
        deletedDate: null,
        reprompt: 0,
        key: { encryptedString: "EncryptedString", encryptionType: 0 },
        login: {
          passwordRevisionDate: new Date("2022-01-31T12:00:00.000Z"),
          autofillOnPageLoad: false,
          username: { encryptedString: "EncryptedString", encryptionType: 0 },
          password: { encryptedString: "EncryptedString", encryptionType: 0 },
          totp: { encryptedString: "EncryptedString", encryptionType: 0 },
          uris: [{ match: 0, uri: { encryptedString: "EncryptedString", encryptionType: 0 } }],
        },
        attachments: [
          {
            fileName: { encryptedString: "file", encryptionType: 0 },
            id: "a1",
            key: { encryptedString: "EncKey", encryptionType: 0 },
            size: "1100",
            sizeName: "1.1 KB",
            url: "url",
          },
          {
            fileName: { encryptedString: "file", encryptionType: 0 },
            id: "a2",
            key: { encryptedString: "EncKey", encryptionType: 0 },
            size: "1100",
            sizeName: "1.1 KB",
            url: "url",
          },
        ],
        fields: [
          {
            linkedId: null,
            name: { encryptedString: "EncryptedString", encryptionType: 0 },
            type: 0,
            value: { encryptedString: "EncryptedString", encryptionType: 0 },
          },
          {
            linkedId: null,
            name: { encryptedString: "EncryptedString", encryptionType: 0 },
            type: 1,
            value: { encryptedString: "EncryptedString", encryptionType: 0 },
          },
        ],
        passwordHistory: [
          {
            lastUsedDate: new Date("2022-01-31T12:00:00.000Z"),
            password: { encryptedString: "EncryptedString", encryptionType: 0 },
          },
        ],
      });
    });

    it("toCipherData", () => {
      const cipher = new Cipher(cipherData);
      expect(cipher.toCipherData()).toEqual(cipherData);
    });

    it("Decrypt", async () => {
      const cipher = new Cipher();
      cipher.id = "id";
      cipher.organizationId = "orgId";
      cipher.folderId = "folderId";
      cipher.edit = true;
      cipher.viewPassword = true;
      cipher.organizationUseTotp = true;
      cipher.favorite = false;
      cipher.revisionDate = new Date("2022-01-31T12:00:00.000Z");
      cipher.type = CipherType.Login;
      cipher.name = mockEnc("EncryptedString");
      cipher.notes = mockEnc("EncryptedString");
      cipher.creationDate = new Date("2022-01-01T12:00:00.000Z");
      cipher.deletedDate = null;
      cipher.reprompt = CipherRepromptType.None;
      cipher.key = mockEnc("EncKey");

      const loginView = new LoginView();
      loginView.username = "username";
      loginView.password = "password";

      const login = mock<Login>();
      login.decrypt.mockResolvedValue(loginView);
      cipher.login = login;

      const cryptoService = mock<CryptoService>();
      const encryptService = mock<EncryptService>();
      const cipherService = mock<CipherService>();

      encryptService.decryptToBytes.mockResolvedValue(makeStaticByteArray(64));

      (window as any).bitwardenContainerService = new ContainerService(
        cryptoService,
        encryptService
      );

      const cipherView = await cipher.decrypt(
        await cipherService.getKeyForCipherKeyDecryption(cipher)
      );

      expect(cipherView).toMatchObject({
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        name: "EncryptedString",
        notes: "EncryptedString",
        type: 1,
        favorite: false,
        organizationUseTotp: true,
        edit: true,
        viewPassword: true,
        login: loginView,
        attachments: null,
        fields: null,
        passwordHistory: null,
        collectionIds: undefined,
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
        creationDate: new Date("2022-01-01T12:00:00.000Z"),
        deletedDate: null,
        reprompt: 0,
        localData: undefined,
      });
    });
  });

  describe("SecureNoteCipher", () => {
    let cipherData: CipherData;

    beforeEach(() => {
      cipherData = {
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        edit: true,
        viewPassword: true,
        organizationUseTotp: true,
        favorite: false,
        revisionDate: "2022-01-31T12:00:00.000Z",
        type: CipherType.SecureNote,
        name: "EncryptedString",
        notes: "EncryptedString",
        creationDate: "2022-01-01T12:00:00.000Z",
        deletedDate: null,
        reprompt: CipherRepromptType.None,
        key: "EncKey",
        secureNote: {
          type: SecureNoteType.Generic,
        },
      };
    });

    it("Convert", () => {
      const cipher = new Cipher(cipherData);

      expect(cipher).toEqual({
        initializerKey: InitializerKey.Cipher,
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        name: { encryptedString: "EncryptedString", encryptionType: 0 },
        notes: { encryptedString: "EncryptedString", encryptionType: 0 },
        type: 2,
        favorite: false,
        organizationUseTotp: true,
        edit: true,
        viewPassword: true,
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
        collectionIds: undefined,
        localData: null,
        creationDate: new Date("2022-01-01T12:00:00.000Z"),
        deletedDate: null,
        reprompt: 0,
        secureNote: { type: SecureNoteType.Generic },
        attachments: null,
        fields: null,
        passwordHistory: null,
        key: { encryptedString: "EncKey", encryptionType: 0 },
      });
    });

    it("toCipherData", () => {
      const cipher = new Cipher(cipherData);
      expect(cipher.toCipherData()).toEqual(cipherData);
    });

    it("Decrypt", async () => {
      const cipher = new Cipher();
      cipher.id = "id";
      cipher.organizationId = "orgId";
      cipher.folderId = "folderId";
      cipher.edit = true;
      cipher.viewPassword = true;
      cipher.organizationUseTotp = true;
      cipher.favorite = false;
      cipher.revisionDate = new Date("2022-01-31T12:00:00.000Z");
      cipher.type = CipherType.SecureNote;
      cipher.name = mockEnc("EncryptedString");
      cipher.notes = mockEnc("EncryptedString");
      cipher.creationDate = new Date("2022-01-01T12:00:00.000Z");
      cipher.deletedDate = null;
      cipher.reprompt = CipherRepromptType.None;
      cipher.secureNote = new SecureNote();
      cipher.secureNote.type = SecureNoteType.Generic;
      cipher.key = mockEnc("EncKey");

      const cryptoService = mock<CryptoService>();
      const encryptService = mock<EncryptService>();
      const cipherService = mock<CipherService>();

      encryptService.decryptToBytes.mockResolvedValue(makeStaticByteArray(64));

      (window as any).bitwardenContainerService = new ContainerService(
        cryptoService,
        encryptService
      );

      const cipherView = await cipher.decrypt(
        await cipherService.getKeyForCipherKeyDecryption(cipher)
      );

      expect(cipherView).toMatchObject({
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        name: "EncryptedString",
        notes: "EncryptedString",
        type: 2,
        favorite: false,
        organizationUseTotp: true,
        edit: true,
        viewPassword: true,
        secureNote: { type: 0 },
        attachments: null,
        fields: null,
        passwordHistory: null,
        collectionIds: undefined,
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
        creationDate: new Date("2022-01-01T12:00:00.000Z"),
        deletedDate: null,
        reprompt: 0,
        localData: undefined,
      });
    });
  });

  describe("CardCipher", () => {
    let cipherData: CipherData;

    beforeEach(() => {
      cipherData = {
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        edit: true,
        viewPassword: true,
        organizationUseTotp: true,
        favorite: false,
        revisionDate: "2022-01-31T12:00:00.000Z",
        type: CipherType.Card,
        name: "EncryptedString",
        notes: "EncryptedString",
        creationDate: "2022-01-01T12:00:00.000Z",
        deletedDate: null,
        reprompt: CipherRepromptType.None,
        card: {
          cardholderName: "EncryptedString",
          brand: "EncryptedString",
          number: "EncryptedString",
          expMonth: "EncryptedString",
          expYear: "EncryptedString",
          code: "EncryptedString",
        },
        key: "EncKey",
      };
    });

    it("Convert", () => {
      const cipher = new Cipher(cipherData);

      expect(cipher).toEqual({
        initializerKey: InitializerKey.Cipher,
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        name: { encryptedString: "EncryptedString", encryptionType: 0 },
        notes: { encryptedString: "EncryptedString", encryptionType: 0 },
        type: 3,
        favorite: false,
        organizationUseTotp: true,
        edit: true,
        viewPassword: true,
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
        collectionIds: undefined,
        localData: null,
        creationDate: new Date("2022-01-01T12:00:00.000Z"),
        deletedDate: null,
        reprompt: 0,
        card: {
          cardholderName: { encryptedString: "EncryptedString", encryptionType: 0 },
          brand: { encryptedString: "EncryptedString", encryptionType: 0 },
          number: { encryptedString: "EncryptedString", encryptionType: 0 },
          expMonth: { encryptedString: "EncryptedString", encryptionType: 0 },
          expYear: { encryptedString: "EncryptedString", encryptionType: 0 },
          code: { encryptedString: "EncryptedString", encryptionType: 0 },
        },
        attachments: null,
        fields: null,
        passwordHistory: null,
        key: { encryptedString: "EncKey", encryptionType: 0 },
      });
    });

    it("toCipherData", () => {
      const cipher = new Cipher(cipherData);
      expect(cipher.toCipherData()).toEqual(cipherData);
    });

    it("Decrypt", async () => {
      const cipher = new Cipher();
      cipher.id = "id";
      cipher.organizationId = "orgId";
      cipher.folderId = "folderId";
      cipher.edit = true;
      cipher.viewPassword = true;
      cipher.organizationUseTotp = true;
      cipher.favorite = false;
      cipher.revisionDate = new Date("2022-01-31T12:00:00.000Z");
      cipher.type = CipherType.Card;
      cipher.name = mockEnc("EncryptedString");
      cipher.notes = mockEnc("EncryptedString");
      cipher.creationDate = new Date("2022-01-01T12:00:00.000Z");
      cipher.deletedDate = null;
      cipher.reprompt = CipherRepromptType.None;
      cipher.key = mockEnc("EncKey");

      const cardView = new CardView();
      cardView.cardholderName = "cardholderName";
      cardView.number = "4111111111111111";

      const card = mock<Card>();
      card.decrypt.mockResolvedValue(cardView);
      cipher.card = card;

      const cryptoService = mock<CryptoService>();
      const encryptService = mock<EncryptService>();
      const cipherService = mock<CipherService>();

      encryptService.decryptToBytes.mockResolvedValue(makeStaticByteArray(64));

      (window as any).bitwardenContainerService = new ContainerService(
        cryptoService,
        encryptService
      );

      const cipherView = await cipher.decrypt(
        await cipherService.getKeyForCipherKeyDecryption(cipher)
      );

      expect(cipherView).toMatchObject({
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        name: "EncryptedString",
        notes: "EncryptedString",
        type: 3,
        favorite: false,
        organizationUseTotp: true,
        edit: true,
        viewPassword: true,
        card: cardView,
        attachments: null,
        fields: null,
        passwordHistory: null,
        collectionIds: undefined,
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
        creationDate: new Date("2022-01-01T12:00:00.000Z"),
        deletedDate: null,
        reprompt: 0,
        localData: undefined,
      });
    });
  });

  describe("IdentityCipher", () => {
    let cipherData: CipherData;

    beforeEach(() => {
      cipherData = {
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        edit: true,
        viewPassword: true,
        organizationUseTotp: true,
        favorite: false,
        revisionDate: "2022-01-31T12:00:00.000Z",
        type: CipherType.Identity,
        name: "EncryptedString",
        notes: "EncryptedString",
        creationDate: "2022-01-01T12:00:00.000Z",
        deletedDate: null,
        reprompt: CipherRepromptType.None,
        key: "EncKey",
        identity: {
          title: "EncryptedString",
          firstName: "EncryptedString",
          middleName: "EncryptedString",
          lastName: "EncryptedString",
          address1: "EncryptedString",
          address2: "EncryptedString",
          address3: "EncryptedString",
          city: "EncryptedString",
          state: "EncryptedString",
          postalCode: "EncryptedString",
          country: "EncryptedString",
          company: "EncryptedString",
          email: "EncryptedString",
          phone: "EncryptedString",
          ssn: "EncryptedString",
          username: "EncryptedString",
          passportNumber: "EncryptedString",
          licenseNumber: "EncryptedString",
        },
      };
    });

    it("Convert", () => {
      const cipher = new Cipher(cipherData);

      expect(cipher).toEqual({
        initializerKey: InitializerKey.Cipher,
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        name: { encryptedString: "EncryptedString", encryptionType: 0 },
        notes: { encryptedString: "EncryptedString", encryptionType: 0 },
        type: 4,
        favorite: false,
        organizationUseTotp: true,
        edit: true,
        viewPassword: true,
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
        collectionIds: undefined,
        localData: null,
        creationDate: new Date("2022-01-01T12:00:00.000Z"),
        deletedDate: null,
        reprompt: 0,
        identity: {
          title: { encryptedString: "EncryptedString", encryptionType: 0 },
          firstName: { encryptedString: "EncryptedString", encryptionType: 0 },
          middleName: { encryptedString: "EncryptedString", encryptionType: 0 },
          lastName: { encryptedString: "EncryptedString", encryptionType: 0 },
          address1: { encryptedString: "EncryptedString", encryptionType: 0 },
          address2: { encryptedString: "EncryptedString", encryptionType: 0 },
          address3: { encryptedString: "EncryptedString", encryptionType: 0 },
          city: { encryptedString: "EncryptedString", encryptionType: 0 },
          state: { encryptedString: "EncryptedString", encryptionType: 0 },
          postalCode: { encryptedString: "EncryptedString", encryptionType: 0 },
          country: { encryptedString: "EncryptedString", encryptionType: 0 },
          company: { encryptedString: "EncryptedString", encryptionType: 0 },
          email: { encryptedString: "EncryptedString", encryptionType: 0 },
          phone: { encryptedString: "EncryptedString", encryptionType: 0 },
          ssn: { encryptedString: "EncryptedString", encryptionType: 0 },
          username: { encryptedString: "EncryptedString", encryptionType: 0 },
          passportNumber: { encryptedString: "EncryptedString", encryptionType: 0 },
          licenseNumber: { encryptedString: "EncryptedString", encryptionType: 0 },
        },
        attachments: null,
        fields: null,
        passwordHistory: null,
        key: { encryptedString: "EncKey", encryptionType: 0 },
      });
    });

    it("toCipherData", () => {
      const cipher = new Cipher(cipherData);
      expect(cipher.toCipherData()).toEqual(cipherData);
    });

    it("Decrypt", async () => {
      const cipher = new Cipher();
      cipher.id = "id";
      cipher.organizationId = "orgId";
      cipher.folderId = "folderId";
      cipher.edit = true;
      cipher.viewPassword = true;
      cipher.organizationUseTotp = true;
      cipher.favorite = false;
      cipher.revisionDate = new Date("2022-01-31T12:00:00.000Z");
      cipher.type = CipherType.Identity;
      cipher.name = mockEnc("EncryptedString");
      cipher.notes = mockEnc("EncryptedString");
      cipher.creationDate = new Date("2022-01-01T12:00:00.000Z");
      cipher.deletedDate = null;
      cipher.reprompt = CipherRepromptType.None;
      cipher.key = mockEnc("EncKey");

      const identityView = new IdentityView();
      identityView.firstName = "firstName";
      identityView.lastName = "lastName";

      const identity = mock<Identity>();
      identity.decrypt.mockResolvedValue(identityView);
      cipher.identity = identity;

      const cryptoService = mock<CryptoService>();
      const encryptService = mock<EncryptService>();
      const cipherService = mock<CipherService>();

      encryptService.decryptToBytes.mockResolvedValue(makeStaticByteArray(64));

      (window as any).bitwardenContainerService = new ContainerService(
        cryptoService,
        encryptService
      );

      const cipherView = await cipher.decrypt(
        await cipherService.getKeyForCipherKeyDecryption(cipher)
      );

      expect(cipherView).toMatchObject({
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        name: "EncryptedString",
        notes: "EncryptedString",
        type: 4,
        favorite: false,
        organizationUseTotp: true,
        edit: true,
        viewPassword: true,
        identity: identityView,
        attachments: null,
        fields: null,
        passwordHistory: null,
        collectionIds: undefined,
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
        creationDate: new Date("2022-01-01T12:00:00.000Z"),
        deletedDate: null,
        reprompt: 0,
        localData: undefined,
      });
    });
  });

  describe("fromJSON", () => {
    it("initializes nested objects", () => {
      jest.spyOn(Attachment, "fromJSON").mockImplementation(mockFromJson);
      jest.spyOn(Field, "fromJSON").mockImplementation(mockFromJson);
      jest.spyOn(Password, "fromJSON").mockImplementation(mockFromJson);
      jest.spyOn(EncString, "fromJSON").mockImplementation(mockFromJson);

      const revisionDate = new Date("2022-08-04T01:06:40.441Z");
      const deletedDate = new Date("2022-09-04T01:06:40.441Z");
      const actual = Cipher.fromJSON({
        name: "myName",
        notes: "myNotes",
        revisionDate: revisionDate.toISOString(),
        attachments: ["attachment1", "attachment2"] as any,
        fields: ["field1", "field2"] as any,
        passwordHistory: ["ph1", "ph2"] as any,
        deletedDate: deletedDate.toISOString(),
      } as Jsonify<Cipher>);

      expect(actual).toMatchObject({
        name: "myName_fromJSON",
        notes: "myNotes_fromJSON",
        revisionDate: revisionDate,
        attachments: ["attachment1_fromJSON", "attachment2_fromJSON"],
        fields: ["field1_fromJSON", "field2_fromJSON"],
        passwordHistory: ["ph1_fromJSON", "ph2_fromJSON"],
        deletedDate: deletedDate,
      });
      expect(actual).toBeInstanceOf(Cipher);
    });

    test.each([
      // Test description, CipherType, expected output
      ["LoginView", CipherType.Login, { login: "myLogin_fromJSON" }],
      ["CardView", CipherType.Card, { card: "myCard_fromJSON" }],
      ["IdentityView", CipherType.Identity, { identity: "myIdentity_fromJSON" }],
      ["Secure Note", CipherType.SecureNote, { secureNote: "mySecureNote_fromJSON" }],
    ])("initializes %s", (description: string, cipherType: CipherType, expected: any) => {
      jest.spyOn(Login, "fromJSON").mockImplementation(mockFromJson);
      jest.spyOn(Identity, "fromJSON").mockImplementation(mockFromJson);
      jest.spyOn(Card, "fromJSON").mockImplementation(mockFromJson);
      jest.spyOn(SecureNote, "fromJSON").mockImplementation(mockFromJson);

      const actual = Cipher.fromJSON({
        login: "myLogin",
        card: "myCard",
        identity: "myIdentity",
        secureNote: "mySecureNote",
        type: cipherType,
      } as any);

      expect(actual).toMatchObject(expected);
    });

    it("returns null if object is null", () => {
      expect(Cipher.fromJSON(null)).toBeNull();
    });
  });
});
