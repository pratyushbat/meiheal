// hover-menu-trigger.directive.ts
import { Directive, TemplateRef } from '@angular/core';

@Directive({ selector: 'ng-template[appHoverMenuTrigger]', standalone: true })
export class HoverMenuTriggerDirective {
    constructor(public templateRef: TemplateRef<any>) { }
}