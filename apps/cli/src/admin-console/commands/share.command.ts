import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";

import { Response } from "../../models/response";
import { CliUtils } from "../../utils";
import { CipherResponse } from "../../vault/models/cipher.response";

export class ShareCommand {
  constructor(private cipherService: CipherService) {}

  async run(id: string, organizationId: string, requestJson: string): Promise<Response> {
    if (process.env.BW_SERVE !== "true" && (requestJson == null || requestJson === "")) {
      requestJson = await CliUtils.readStdin();
    }

    if (requestJson == null || requestJson === "") {
      return Response.badRequest("`requestJson` was not provided.");
    }

    let req: string[] = [];
    if (typeof requestJson !== "string") {
      req = requestJson;
    } else {
      try {
        const reqJson = Buffer.from(requestJson, "base64").toString();
        req = JSON.parse(reqJson);
        if (req == null || req.length === 0) {
          return Response.badRequest("You must provide at least one collection id for this item.");
        }
      } catch (e) {
        return Response.badRequest("Error parsing the encoded request data.");
      }
    }

    if (id != null) {
      id = id.toLowerCase();
    }
    if (organizationId != null) {
      organizationId = organizationId.toLowerCase();
    }

    const cipher = await this.cipherService.get(id);
    if (cipher == null) {
      return Response.notFound();
    }
    if (cipher.organizationId != null) {
      return Response.badRequest("This item already belongs to an organization.");
    }
    const cipherView = await cipher.decrypt(
      await this.cipherService.getKeyForCipherKeyDecryption(cipher)
    );
    try {
      await this.cipherService.shareWithServer(cipherView, organizationId, req);
      const updatedCipher = await this.cipherService.get(cipher.id);
      const decCipher = await updatedCipher.decrypt(
        await this.cipherService.getKeyForCipherKeyDecryption(updatedCipher)
      );
      const res = new CipherResponse(decCipher);
      return Response.success(res);
    } catch (e) {
      return Response.error(e);
    }
  }
}
