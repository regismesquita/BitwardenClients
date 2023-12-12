import { Component, HostBinding, Input } from "@angular/core";

import { RadioGroupComponent } from "./radio-group.component";

let nextId = 0;

@Component({
  selector: "bit-radio-button",
  templateUrl: "radio-button.component.html",
})
export class RadioButtonComponent {
  @HostBinding("attr.id") @Input() id = `bit-radio-button-${nextId++}`;
  @HostBinding("class") get classList() {
    return [this.block ? "tw-block" : "tw-inline-block", "tw-mb-2"];
  }

  @Input() value: unknown;
  @Input() disabled = false;

  constructor(private groupComponent: RadioGroupComponent) {}

  get inputId() {
    return `${this.id}-input`;
  }

  get name() {
    return this.groupComponent.name;
  }

  get selected() {
    return this.groupComponent.selected === this.value;
  }

  get groupDisabled() {
    return this.groupComponent.disabled;
  }

  get block() {
    return this.groupComponent.block;
  }

  protected onInputChange() {
    this.groupComponent.onInputChange(this.value);
  }

  protected onBlur() {
    this.groupComponent.onBlur();
  }
}
