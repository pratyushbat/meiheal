// hover-menu.component.ts
import {
  Component, ContentChild, ViewChild, ElementRef, ViewContainerRef,
  AfterContentInit, OnDestroy
} from '@angular/core';
import { Overlay, OverlayRef, OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';
import { TemplatePortal, PortalModule } from '@angular/cdk/portal';
import { NgTemplateOutlet } from '@angular/common';
import { HoverMenuTriggerDirective } from '../../../directive/hover-menu-trigger.directive';
import { HoverMenuPanelDirective } from '../../../directive/hover-menu-panel.directive';

@Component({
  selector: 'app-hover-menu',
  standalone: true,
  imports: [OverlayModule, PortalModule, NgTemplateOutlet],
  template: `
    <span
      #triggerEl
      (mouseenter)="onTriggerEnter()"
      (mouseleave)="onTriggerLeave()">
      <ng-container *ngTemplateOutlet="triggerDir?.templateRef"></ng-container>
    </span>

    <ng-template #panelWrapper>
      <div
        class="menu-panel"
        [class.visible]="isOpen"
        (mouseenter)="onPanelEnter()"
        (mouseleave)="onPanelLeave()">
        <ng-container *ngTemplateOutlet="panelDir?.templateRef"></ng-container>
      </div>
    </ng-template>
  `,
  styles: [`
    .menu-panel {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 1px 6px rgba(210,214,220,0.3);
      padding: 1rem;
      min-width: 200px;
      visibility: hidden;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.12s ease;
    }
    .menu-panel.visible {
      visibility: visible;
      opacity: 1;
      pointer-events: auto;
    }
  `]
})
export class HoverMenuComponent implements AfterContentInit, OnDestroy {
  @ContentChild(HoverMenuTriggerDirective) triggerDir!: HoverMenuTriggerDirective;
  @ContentChild(HoverMenuPanelDirective) panelDir!: HoverMenuPanelDirective;

  @ViewChild('triggerEl') triggerEl!: ElementRef;
  @ViewChild('panelWrapper') panelWrapper!: any; // TemplateRef

  isOpen = false;
  private overlayRef?: OverlayRef;
  private closeTimeout?: ReturnType<typeof setTimeout>;

  constructor(private overlay: Overlay, private vcr: ViewContainerRef) { }

  ngAfterContentInit() {
    if (!this.triggerDir || !this.panelDir) {
      console.error('app-hover-menu requires both appHoverMenuTrigger and appHoverMenuPanel templates');
    }
  }

  onTriggerEnter() {
    this.cancelClose();
    this.ensureAttached();
    this.isOpen = true;
  }

  onTriggerLeave() {
    this.scheduleClose();
  }

  onPanelEnter() {
    this.cancelClose();
  }

  onPanelLeave() {
    this.scheduleClose();
  }

  private ensureAttached() {
    if (this.overlayRef?.hasAttached()) return;

    const positions: ConnectedPosition[] = [
      { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
      { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 }
    ];

    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo(this.triggerEl)
      .withPositions(positions)
      .withFlexibleDimensions(true)
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: false
    });

    const portal = new TemplatePortal(this.panelWrapper, this.vcr);
    this.overlayRef.attach(portal);
  }

  private scheduleClose() {
    this.closeTimeout = setTimeout(() => {
      this.isOpen = false;
    }, 150);
  }

  private cancelClose() {
    if (this.closeTimeout) clearTimeout(this.closeTimeout);
  }

  ngOnDestroy() {
    this.cancelClose();
    this.overlayRef?.dispose();
  }
}