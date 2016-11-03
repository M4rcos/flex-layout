import { MediaQueryChange } from "../../media-query/media-queries";

// ****************************************************************
// Exported Types and Interfaces
// ****************************************************************

/**
 * MQ Notification data emitted to external observers
 *
 */
export class MediaQueryChanges {
  constructor(public previous : MediaQueryChange, public current : MediaQueryChange) { }
}


/**
 * @whatItDoes Lifecycle hook that is called when any mediaQuery breakpoint changes.
 * @howToUse
 *
 * @description
 * `ngOnMediaQueryChanges` is called right after the a MediaQueryChange has occurred.
 */
export declare abstract class OnMediaQueryChanges {
    abstract fxOnMediaQueryChanges(changes: MediaQueryChanges): void;
}


export type MediaQuerySubscriber = (e:MediaQueryChanges) => { };