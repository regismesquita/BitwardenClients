import * as fs from "fs";
import * as path from "path";

import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { SendType } from "@bitwarden/common/tools/send/enums/send-type";
import { SendApiService } from "@bitwarden/common/tools/send/services/send-api.service.abstraction";
import { SendService } from "@bitwarden/common/tools/send/services/send.service.abstraction";
import { NodeUtils } from "@bitwarden/node/node-utils";

import { Response } from "../../../models/response";
import { CliUtils } from "../../../utils";
import { SendTextResponse } from "../models/send-text.response";
import { SendResponse } from "../models/send.response";

export class SendCreateCommand {
  constructor(
    private sendService: SendService,
    private stateService: StateService,
    private environmentService: EnvironmentService,
    private sendApiService: SendApiService
  ) {}

  async run(requestJson: any, cmdOptions: Record<string, any>) {
    let req: any = null;
    if (process.env.BW_SERVE !== "true" && (requestJson == null || requestJson === "")) {
      requestJson = await CliUtils.readStdin();
    }

    if (requestJson == null || requestJson === "") {
      return Response.badRequest("`requestJson` was not provided.");
    }

    if (typeof requestJson !== "string") {
      req = requestJson;
      req.deletionDate = req.deletionDate == null ? null : new Date(req.deletionDate);
      req.expirationDate = req.expirationDate == null ? null : new Date(req.expirationDate);
    } else {
      try {
        const reqJson = Buffer.from(requestJson, "base64").toString();
        req = SendResponse.fromJson(reqJson);

        if (req == null) {
          throw new Error("Null request");
        }
      } catch (e) {
        return Response.badRequest("Error parsing the encoded request data.");
      }
    }

    if (
      req.deletionDate == null ||
      isNaN(new Date(req.deletionDate).getTime()) ||
      new Date(req.deletionDate) <= new Date()
    ) {
      return Response.badRequest("Must specify a valid deletion date after the current time");
    }

    if (req.expirationDate != null && isNaN(new Date(req.expirationDate).getTime())) {
      return Response.badRequest("Unable to parse expirationDate: " + req.expirationDate);
    }

    const normalizedOptions = new Options(cmdOptions);
    return this.createSend(req, normalizedOptions);
  }

  private async createSend(req: SendResponse, options: Options) {
    const filePath = req.file?.fileName ?? options.file;
    const text = req.text?.text ?? options.text;
    const hidden = req.text?.hidden ?? options.hidden;
    const password = req.password ?? options.password;
    const maxAccessCount = req.maxAccessCount ?? options.maxAccessCount;

    req.key = null;
    req.maxAccessCount = maxAccessCount;

    switch (req.type) {
      case SendType.File:
        if (process.env.BW_SERVE === "true") {
          return Response.error(
            "Creating a file-based Send is unsupported through the `serve` command at this time."
          );
        }

        if (!(await this.stateService.getCanAccessPremium())) {
          return Response.error("Premium status is required to use this feature.");
        }

        if (filePath == null) {
          return Response.badRequest(
            "Must specify a file to Send either with the --file option or in the request JSON."
          );
        }

        req.file.fileName = path.basename(filePath);
        break;
      case SendType.Text:
        if (text == null) {
          return Response.badRequest(
            "Must specify text content to Send either with the --text option or in the request JSON."
          );
        }
        req.text = new SendTextResponse();
        req.text.text = text;
        req.text.hidden = hidden;
        break;
      default:
        return Response.badRequest(
          "Unknown Send type " + SendType[req.type] + ". Valid types are: file, text"
        );
    }

    try {
      let fileBuffer: ArrayBuffer = null;
      if (req.type === SendType.File) {
        fileBuffer = NodeUtils.bufferToArrayBuffer(fs.readFileSync(filePath));
      }

      const sendView = SendResponse.toView(req);
      const [encSend, fileData] = await this.sendService.encrypt(sendView, fileBuffer, password);
      // Add dates from template
      encSend.deletionDate = sendView.deletionDate;
      encSend.expirationDate = sendView.expirationDate;

      await this.sendApiService.save([encSend, fileData]);
      const newSend = await this.sendService.getFromState(encSend.id);
      const decSend = await newSend.decrypt();
      const res = new SendResponse(decSend, this.environmentService.getWebVaultUrl());
      return Response.success(res);
    } catch (e) {
      return Response.error(e);
    }
  }
}

class Options {
  file: string;
  text: string;
  maxAccessCount: number;
  password: string;
  hidden: boolean;

  constructor(passedOptions: Record<string, any>) {
    this.file = passedOptions?.file;
    this.text = passedOptions?.text;
    this.password = passedOptions?.password;
    this.hidden = CliUtils.convertBooleanOption(passedOptions?.hidden);
    this.maxAccessCount =
      passedOptions?.maxAccessCount != null ? parseInt(passedOptions.maxAccessCount, null) : null;
  }
}
