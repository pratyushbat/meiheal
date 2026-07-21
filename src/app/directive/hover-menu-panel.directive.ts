// hover-menu-panel.directive.ts
import { Directive, TemplateRef } from '@angular/core';

@Directive({ selector: 'ng-template[appHoverMenuPanel]', standalone: true })
export class HoverMenuPanelDirective {
    constructor(public templateRef: TemplateRef<any>) { }
}