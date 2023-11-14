import { A11yModule } from "@angular/cdk/a11y";
import { Component, EventEmitter, Input, Output, TemplateRef, ViewChild } from "@angular/core";

import { IconButtonModule } from "../icon-button/icon-button.module";
import { SharedModule } from "../shared/shared.module";

@Component({
  standalone: true,
  selector: "bit-popover",
  imports: [A11yModule, IconButtonModule, SharedModule],
  templateUrl: "./popover.component.html",
  exportAs: "popoverComponent",
})
export class PopoverComponent {
  @ViewChild(TemplateRef) templateRef: TemplateRef<any>;
  @Input() title = "";
  @Output() closed = new EventEmitter();
}
