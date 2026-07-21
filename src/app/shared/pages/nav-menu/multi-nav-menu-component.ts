import { Component, ViewChild, ElementRef, TemplateRef, ViewContainerRef, OnDestroy } from '@angular/core';
import { Overlay, OverlayRef, OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';
import { TemplatePortal, PortalModule } from '@angular/cdk/portal';
import { HoverMenuComponent } from './hover-menu-component';
import { HoverMenuTriggerDirective } from '../../../directive/hover-menu-trigger.directive';
import { HoverMenuPanelDirective } from '../../../directive/hover-menu-panel.directive';

@Component({
    selector: 'muti-nav-menu',
    standalone: true,
    imports: [HoverMenuComponent, HoverMenuTriggerDirective, HoverMenuPanelDirective],
    template: `
   <!-- nav.component.html -->
<nav class="flex gap-4">
<H2>Overlay</H2>
  <app-hover-menu>
    <ng-template appHoverMenuTrigger><button>Menu 1</button></ng-template>
    <ng-template appHoverMenuPanel>
      <a href="#">Overview</a>
      <a href="#"> Health Store Plans</a>
    </ng-template>
  </app-hover-menu>

  <app-hover-menu>
    <ng-template appHoverMenuTrigger><button>Menu 2</button></ng-template>
    <ng-template appHoverMenuPanel>
      <a href="#">Active Plan</a>
      <a href="#">Recommendations</a>
    </ng-template>
  </app-hover-menu>

  <app-hover-menu>
    <ng-template appHoverMenuTrigger><button>Menu 3</button></ng-template>
    <ng-template appHoverMenuPanel>
      <a href="#">Something else</a>
    </ng-template>
  </app-hover-menu>

  <app-hover-menu>
    <ng-template appHoverMenuTrigger><button>Profile</button></ng-template>
    <ng-template appHoverMenuPanel>
      <a href="#">Settings</a>
      <a href="#">Logout</a>
    </ng-template>
  </app-hover-menu>

</nav>
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
export class MultiNavMenuComponent implements OnDestroy {
    @ViewChild('trigger') trigger!: ElementRef;
    @ViewChild('menuTemplate') menuTemplate!: TemplateRef<any>;

    isOpen = false;
    private overlayRef?: OverlayRef;
    private closeTimeout?: ReturnType<typeof setTimeout>;

    constructor(private overlay: Overlay, private vcr: ViewContainerRef) { }

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

    // Attach ONCE, and never detach on hover-out — only toggle visibility.
    private ensureAttached() {
        if (this.overlayRef?.hasAttached()) {
            return;
        }

        const positions: ConnectedPosition[] = [
            { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
            { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 }
        ];

        const positionStrategy = this.overlay.position()
            .flexibleConnectedTo(this.trigger)
            .withPositions(positions)
            .withFlexibleDimensions(true)
            .withPush(true);

        this.overlayRef = this.overlay.create({
            positionStrategy,
            scrollStrategy: this.overlay.scrollStrategies.reposition(),
            hasBackdrop: false
        });

        const portal = new TemplatePortal(this.menuTemplate, this.vcr);
        this.overlayRef.attach(portal);
    }

    private scheduleClose() {
        this.closeTimeout = setTimeout(() => {
            this.isOpen = false; // just hide via CSS, don't detach the overlay
        }, 150);
    }

    private cancelClose() {
        if (this.closeTimeout) {
            clearTimeout(this.closeTimeout);
        }
    }

    ngOnDestroy() {
        this.cancelClose();
        this.overlayRef?.dispose(); // only truly tear down when component itself is destroyed
    }
}