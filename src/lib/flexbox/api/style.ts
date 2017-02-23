/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  OnChanges,
  Renderer,
  KeyValueDiffers,
  SimpleChanges
} from '@angular/core';
import {NgStyle} from '@angular/common';

import {BaseFxDirectiveAdapter} from './base-adapter';
import {BreakPointRegistry} from './../../media-query/breakpoints/break-point-registry';
import {MediaChange} from '../../media-query/media-change';
import {MediaMonitor} from '../../media-query/media-monitor';
import {extendObject} from '../../utils/object-extend';

/** NgStyle allowed inputs **/
export type ngStyleMap = {[klass: string]: string};
export type NgStyleType = string | string[] | Set<string> | ngStyleMap;

/**
 * Directive to add responsive support for ngStyle.
 *
 */
@Directive({
  selector: `
    [ngStyle],
    [ngStyle.xs],    [style.xs],    
    [ngStyle.gt-xs], [style.gt-xs], 
    [ngStyle.sm],    [style.sm],
    [ngStyle.gt-sm], [style.gt-sm], 
    [ngStyle.md],    [style.md],        
    [ngStyle.gt-md], [style.gt-md], 
    [ngStyle.lg],    [style.lg],    
    [ngStyle.gt-lg], [style.gt-lg], 
    [ngStyle.xl],    [style.xl]     
  `
})
export class StyleDirective extends NgStyle implements OnInit, OnChanges, OnDestroy {

  @Input('ngStyle')
  set styleBase(val: NgStyleType) {
    this._base.cacheInput('style', val, true);
    this.ngStyle = this._base.inputMap['style'];
  }

  /* tslint:disable */
  @Input('ngStyle.xs')    set ngStyleXs(val: NgStyleType) { this._base.cacheInput('styleXs', val, true); }
  @Input('ngStyle.gt-xs') set ngStyleGtXs(val: NgStyleType) { this._base.cacheInput('styleGtXs', val, true); };
  @Input('ngStyle.sm')    set ngStyleSm(val: NgStyleType) {  this._base.cacheInput('styleSm', val, true); };
  @Input('ngStyle.gt-sm') set ngStyleGtSm(val: NgStyleType) { this._base.cacheInput('styleGtSm', val, true);} ;
  @Input('ngStyle.md')    set ngStyleMd(val: NgStyleType) { this._base.cacheInput('styleMd', val, true); };
  @Input('ngStyle.gt-md') set ngStyleGtMd(val: NgStyleType) { this._base.cacheInput('styleGtMd', val, true);};
  @Input('ngStyle.lg')    set ngStyleLg(val: NgStyleType) { this._base.cacheInput('styleLg', val, true);};
  @Input('ngStyle.gt-lg') set ngStyleGtLg(val: NgStyleType) { this._base.cacheInput('styleGtLg', val, true); };
  @Input('ngStyle.xl')    set ngStyleXl(val: NgStyleType) { this._base.cacheInput('styleXl', val, true); };

  /** Deprecated selectors */
  @Input('style.xs')      set styleXs(val: NgStyleType) { this._base.cacheInput('styleXs', val, true); }
  @Input('style.gt-xs')   set styleGtXs(val: NgStyleType) { this._base.cacheInput('styleGtXs', val, true); };
  @Input('style.sm')      set styleSm(val: NgStyleType) {  this._base.cacheInput('styleSm', val, true); };
  @Input('style.gt-sm')   set styleGtSm(val: NgStyleType) { this._base.cacheInput('styleGtSm', val, true); };
  @Input('style.md')      set styleMd(val: NgStyleType) { this._base.cacheInput('styleMd', val, true);};
  @Input('style.gt-md')   set styleGtMd(val: NgStyleType) { this._base.cacheInput('styleGtMd', val, true);};
  @Input('style.lg')      set styleLg(val: NgStyleType) { this._base.cacheInput('styleLg', val, true); };
  @Input('style.gt-lg')   set styleGtLg(val: NgStyleType) { this._base.cacheInput('styleGtLg', val, true); };
  @Input('style.xl')      set styleXl(val: NgStyleType) { this._base.cacheInput('styleXl', val, true); };

  /* tslint:enable */
  /**
   *  Constructor for the ngStyle subclass; which adds selectors and
   *  a MediaQuery Activation Adapter
   */
  constructor(private monitor: MediaMonitor,
              private _bpRegistry: BreakPointRegistry,
              _differs: KeyValueDiffers, _ngEl: ElementRef, _renderer: Renderer) {
    super(_differs, _ngEl, _renderer);
    this._buildAdapter(monitor, _ngEl, _renderer);

    // Get current inline style if any
    this._base.cacheInput('style', _ngEl.nativeElement.getAttribute("style"), true);
  }

  /**
   * For @Input changes on the current mq activation property, see onMediaQueryChanges()
   */
  ngOnChanges(changes: SimpleChanges) {
    const changed = this._bpRegistry.items.some(it => {
      return (`ngStyle${it.suffix}` in changes) || (`style${it.suffix}` in changes);
    });
    if (changed || this._base.mqActivation) {
      this._updateStyle();
    }
  }

  /**
   * After the initial onChanges, build an mqActivation object that bridges
   * mql change events to onMediaQueryChange handlers
   */
  ngOnInit() {
    this._base.listenForMediaQueryChanges('style', '', (changes: MediaChange) => {
      this._updateStyle(changes.value);
    });
  }

  ngOnDestroy() {
    this._base.ngOnDestroy();
  }

  // ************************************************************************
  // Private Internal Methods
  // ************************************************************************

  /**
   * Use the currently activated input property and assign to
   * `ngStyle` which does the style injections...
   */
  private _updateStyle(value?: NgStyleType) {
    let style = value || this._base.queryInput("style") || '';
    if (this._base.mqActivation) {
      style = this._base.mqActivation.activatedInput;
    }

    // Delegate subsequent activity to the NgStyle logic
    this.ngStyle = style;
  }


  /**
   * Build MediaQuery Activation Adapter
   * This adapter manages listening to mediaQuery change events and identifying
   * which property value should be used for the style update
   */
  private _buildAdapter(monitor: MediaMonitor, _ngEl: ElementRef, _renderer: Renderer) {
    this._base = new BaseFxDirectiveAdapter(monitor, _ngEl, _renderer);

    // Build intercept to convert raw strings to ngStyleMap
    let cacheInput = this._base.cacheInput.bind(this._base);
    this._base.cacheInput = (key?: string, source?: any, cacheRaw = false, merge = true) => {
      let styles = this._buildStyleMap(source);
      if (merge) {
        styles = extendObject({}, this._base.inputMap['style'], styles);
      }
      cacheInput(key, styles, cacheRaw);
    };
  }

  /**
   * Convert raw strings to ngStyleMap; which is required by ngStyle
   */
  private _buildStyleMap(styles: NgStyleType) {
    if (typeof styles === 'string') {
      let value = <string> styles;
      return value.replace(",", ";").split(";")
          .map((it: string) => {
            let [key, val] = it.split(":");
            return val ? [`${(key as string).replace("'","").trim()}`, val.trim()] : null;
          })
          .filter(it => it !== null)
          .reduce((map, it) => {
            let [key, val] = it;
            map[key] = val;
            return map;
          }, {});
    }
    return styles;
  }

  /**
   * Special adapter to cross-cut responsive behaviors
   * into the StyleDirective
   */
  private _base: BaseFxDirectiveAdapter;

}
