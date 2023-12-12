import { AutofillOverlayPort } from "../../utils/autofill-overlay.enum";

import AutofillOverlayIframeElement from "./autofill-overlay-iframe-element";

class AutofillOverlayListIframe extends AutofillOverlayIframeElement {
  constructor() {
    super(
      "overlay/list.html",
      AutofillOverlayPort.List,
      {
        height: "0px",
        minWidth: "250px",
        maxHeight: "180px",
        boxShadow: "rgba(0, 0, 0, 0.1) 2px 4px 6px 0px",
        borderRadius: "4px",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "rgb(206, 212, 220)",
      },
      chrome.i18n.getMessage("bitwardenVault")
    );
  }
}

export default AutofillOverlayListIframe;
