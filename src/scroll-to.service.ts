import { Injectable, ElementRef, Renderer2, PLATFORM_ID, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';
import { ScrollToAnimationEasing } from './models/scroll-to-easing.model';
import { ScrollToAnimationOptions } from './models/scroll-to-options.model';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { isString, isWindow } from './scroll-to.helpers';
import { ScrollAnimation } from './statics/scroll-to-animation';

@Injectable()
export class ScrollToService {

	private _animation: ScrollAnimation;

	constructor(
		@Inject(DOCUMENT) private _document: any,
		@Inject(PLATFORM_ID) private _platform_id: any
	) {
	}

	/**
	 * Fire when the event proposition if fulfilled/triggered.
	 *
	 * @param event 				Native Browser Event
	 * @returns void
	 */
	public onTrigger(event: Event, target: HTMLElement, renderer2: Renderer2, config: ScrollToAnimationOptions): void {

		const container = this.getFirstScrollableParent(<HTMLElement>event.target);

		if (this._animation) this._animation.stop();

		// Set ScrollTop
		const windowScrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
		const is_window = isWindow(this._getListenerTarget(container));

		this._animation = new ScrollAnimation(container, is_window, target.offsetTop, config, isPlatformBrowser(this._platform_id));
		const animation$: Observable<number> = this._animation.start();

		const stop_events: string[] = ['mousewheel', 'DOMMouseScroll', 'touchstart'];

		// Listen for Stop Events
		stop_events.forEach(_event => {
			renderer2.listen(this._getListenerTarget(container), _event, () => this._animation && this._animation.stop());
		});
	}

	/**
	 * Find the first scrollable parent node of an element.
	 *
	 * @param nativeElement 			The element to search from
	 * @param includeHidden 			Whether to include hidden elements or not
	 * @return 							The first scrollable parent element
	 */
	public getFirstScrollableParent(nativeElement: HTMLElement, includeHidden: boolean = true): HTMLElement {

		let style: CSSStyleDeclaration = window.getComputedStyle(nativeElement);

		const overflow_regex: RegExp = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/;

		if (style.position === 'fixed') throw new Error(`Scroll item cannot be positioned 'fixed'`);

		// Recursive Loop Parents
		for (let parent = nativeElement; parent = parent.parentElement; null) {

			// Recalculate Style
			style = window.getComputedStyle(parent);

			// Skip Absolute Positioning
			if (style.position === 'absolute') continue;

			// Return Body
			if (parent.tagName === 'BODY') return parent;

			// Test Overflow
			if (overflow_regex.test(style.overflow + style.overflowY + style.overflowX)) return parent;
		}

		throw new Error(`No scrollable parent found for element ${nativeElement.nodeName}`);
	}

	/**
	 * Get the Target Node to scroll to.
	 *
	 * @param id 			The given ID of the node, either a string or an element reference
	 * @returns 			Target Node
	 */
	public getTargetNode(id: string | ElementRef): HTMLElement {

		let node: HTMLElement;

		if (isString(id)) {

			// Strip hashtag from ID
			if (id.substring(0, 1) === '#') id = id.substring(1);

			node = this._document.getElementById(id);
		} else {
			node = id.nativeElement;
		}

		return node;

	}

	/**
	 * Retrieve the Listener target.
	 *
	 * @param container 				The HTML Container element
	 * @returns 						Listener
	 */
	private _getListenerTarget(container: HTMLElement): HTMLElement | Window {
		return container.tagName === 'BODY' ? window : container;
	}

}