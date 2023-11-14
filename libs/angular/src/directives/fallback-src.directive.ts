import { Directive, ElementRef, HostListener, Input } from "@angular/core";

@Directive({
  selector: "[appFallbackSrc]",
})
export class FallbackSrcDirective {
  @Input("appFallbackSrc") appFallbackSrc: string;

  /** Only try setting the fallback once. This prevents an infinite loop if the fallback itself is missing. */
  private tryFallback = true;

  constructor(private el: ElementRef) {}

  @HostListener("error") onError() {
    if (this.tryFallback) {
      this.el.nativeElement.src = this.appFallbackSrc;
      this.tryFallback = false;
    }
  }
}
