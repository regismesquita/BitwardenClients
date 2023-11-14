import { Organization } from "../../../admin-console/models/domain/organization";
import { ITreeNodeObject } from "../../../models/domain/tree-node";
import { View } from "../../../models/view/view";
import { Collection } from "../domain/collection";
import { CollectionAccessDetailsResponse } from "../response/collection.response";

export const NestingDelimiter = "/";

export class CollectionView implements View, ITreeNodeObject {
  id: string = null;
  organizationId: string = null;
  name: string = null;
  externalId: string = null;
  // readOnly applies to the items within a collection
  readOnly: boolean = null;
  hidePasswords: boolean = null;
  manage: boolean = null;

  constructor(c?: Collection | CollectionAccessDetailsResponse) {
    if (!c) {
      return;
    }

    this.id = c.id;
    this.organizationId = c.organizationId;
    this.externalId = c.externalId;
    if (c instanceof Collection) {
      this.readOnly = c.readOnly;
      this.hidePasswords = c.hidePasswords;
      this.manage = c.manage;
    }
  }

  // For editing collection details, not the items within it.
  canEdit(org: Organization): boolean {
    if (org.id !== this.organizationId) {
      throw new Error(
        "Id of the organization provided does not match the org id of the collection."
      );
    }
    return org?.canEditAnyCollection || org?.canEditAssignedCollections;
  }

  // For deleting a collection, not the items within it.
  canDelete(org: Organization, flexibleCollectionsEnabled: boolean): boolean {
    if (org.id !== this.organizationId) {
      throw new Error(
        "Id of the organization provided does not match the org id of the collection."
      );
    }

    if (flexibleCollectionsEnabled) {
      return org?.canDeleteAnyCollection || (!org?.limitCollectionCreationDeletion && this.manage);
    } else {
      return org?.canDeleteAnyCollection || org?.canDeleteAssignedCollections;
    }
  }
}
