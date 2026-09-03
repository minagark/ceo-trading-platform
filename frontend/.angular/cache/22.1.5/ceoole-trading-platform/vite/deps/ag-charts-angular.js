import { n as AgCharts$1 } from "./main.esm-DvZ0PpOP.js";
import { $n as Output, Dr as ViewEncapsulation, El as ɵɵdefineInjector, En as ElementRef, In as Input, Pc as NgZone, Ui as setClassMetadata, ao as ɵɵdirectiveInject, ca as ɵɵNgOnChangesFeature, cn as Component, eo as ɵɵdefineComponent, no as ɵɵdefineNgModule, qn as NgModule, sa as ɵɵInheritDefinitionFeature, yc as EventEmitter } from "./core-DK4zC9WD.js";
//#region node_modules/ag-charts-angular/fesm2022/ag-charts-angular.mjs
var AgChartsBase = class AgChartsBase {
	constructor() {
		this._initialised = false;
	}
	ngAfterViewInit() {
		const options = this.patchChartOptions(this.options);
		this.chart = this.runOutsideAngular(() => this.createChart(options));
		this._initialised = true;
		this.chart.chart.waitForUpdate().then(() => {
			this.chartReady.emit(this.chart);
		});
	}
	ngOnChanges(_changes) {
		this.runOutsideAngular(() => {
			if (!this._initialised || !this.chart) return;
			this.chart.update(this.patchChartOptions(this.options));
		});
	}
	ngOnDestroy() {
		if (this._initialised && this.chart) {
			this.chart.destroy();
			this.chart = void 0;
			this._initialised = false;
		}
	}
	patchChartOptions(propsOptions) {
		const patched = { ...propsOptions };
		if (propsOptions.listeners) patched.listeners = this.patchListeners(propsOptions.listeners);
		if (propsOptions.legend?.listeners) patched.legend = {
			...propsOptions.legend,
			listeners: this.patchListeners(propsOptions.legend.listeners)
		};
		if (Array.isArray(propsOptions.series)) patched.series = propsOptions.series.map((series) => series?.listeners ? {
			...series,
			listeners: this.patchListeners(series.listeners)
		} : series);
		if (propsOptions.contextMenu) patched.contextMenu = this.patchContextMenu(propsOptions.contextMenu);
		patched.container ??= this._nativeElement;
		return patched;
	}
	patchListeners(listenerConfig) {
		const config = listenerConfig;
		const patched = {};
		for (const listenerName of Object.keys(config)) {
			const listener = config[listenerName];
			patched[listenerName] = typeof listener === "function" ? (...args) => this.runInsideAngular(() => listener(...args)) : listener;
		}
		return patched;
	}
	patchContextMenu(contextMenu) {
		const patched = { ...contextMenu };
		if (typeof patched.getItems === "function") patched.getItems = this.wrapGetItems(patched.getItems);
		if (Array.isArray(patched.items)) patched.items = this.wrapContextMenuItems(patched.items);
		return patched;
	}
	wrapGetItems(getItems) {
		return (params) => {
			const items = getItems(params);
			return items ? this.wrapContextMenuItems(items) : void 0;
		};
	}
	wrapContextMenuItems(items) {
		return items.map((item) => {
			if (typeof item === "string") return item;
			const copy = { ...item };
			if (typeof copy.action === "function") copy.action = this.wrapZoneAction(copy.action);
			if (Array.isArray(copy.items)) copy.items = this.wrapContextMenuItems(copy.items);
			return copy;
		});
	}
	wrapZoneAction(action) {
		return (...args) => this.runInsideAngular(() => action(...args));
	}
	runOutsideAngular(callback) {
		return this.ngZone ? this.ngZone.runOutsideAngular(callback) : callback();
	}
	runInsideAngular(callback) {
		return this.ngZone ? this.ngZone.run(callback) : callback();
	}
	static {
		this.ɵfac = function AgChartsBase_Factory(__ngFactoryType__) {
			return new (__ngFactoryType__ || AgChartsBase)();
		};
	}
	static {
		this.ɵcmp = /* @__PURE__ */ ɵɵdefineComponent({
			type: AgChartsBase,
			selectors: [["ng-component"]],
			features: [ɵɵNgOnChangesFeature],
			decls: 0,
			vars: 0,
			template: function AgChartsBase_Template(rf, ctx) {},
			encapsulation: 2,
			changeDetection: 1
		});
	}
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AgChartsBase, [{
		type: Component,
		args: [{ template: "" }]
	}], null, null);
})();
var AgCharts = class AgCharts extends AgChartsBase {
	constructor(elementDef, ngZone) {
		super();
		this.ngZone = ngZone;
		this.options = {};
		this.chartReady = new EventEmitter();
		this._nativeElement = elementDef.nativeElement;
	}
	createChart(options) {
		return AgCharts$1.create(options);
	}
	static {
		this.ɵfac = function AgCharts_Factory(__ngFactoryType__) {
			return new (__ngFactoryType__ || AgCharts)(ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(NgZone));
		};
	}
	static {
		this.ɵcmp = /* @__PURE__ */ ɵɵdefineComponent({
			type: AgCharts,
			selectors: [["ag-charts"]],
			inputs: { options: "options" },
			outputs: { chartReady: "chartReady" },
			features: [ɵɵInheritDefinitionFeature],
			decls: 0,
			vars: 0,
			template: function AgCharts_Template(rf, ctx) {},
			encapsulation: 2,
			changeDetection: 1
		});
	}
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AgCharts, [{
		type: Component,
		args: [{
			selector: "ag-charts",
			standalone: true,
			template: "",
			encapsulation: ViewEncapsulation.None
		}]
	}], () => [{ type: ElementRef }, { type: NgZone }], {
		options: [{ type: Input }],
		chartReady: [{ type: Output }]
	});
})();
var AgFinancialCharts = class AgFinancialCharts extends AgChartsBase {
	constructor(elementDef, ngZone) {
		super();
		this.ngZone = ngZone;
		this.options = {};
		this.chartReady = new EventEmitter();
		this._nativeElement = elementDef.nativeElement;
	}
	createChart(options) {
		return AgCharts$1.createFinancialChart(options);
	}
	static {
		this.ɵfac = function AgFinancialCharts_Factory(__ngFactoryType__) {
			return new (__ngFactoryType__ || AgFinancialCharts)(ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(NgZone));
		};
	}
	static {
		this.ɵcmp = /* @__PURE__ */ ɵɵdefineComponent({
			type: AgFinancialCharts,
			selectors: [["ag-financial-charts"]],
			inputs: { options: "options" },
			outputs: { chartReady: "chartReady" },
			features: [ɵɵInheritDefinitionFeature],
			decls: 0,
			vars: 0,
			template: function AgFinancialCharts_Template(rf, ctx) {},
			encapsulation: 2,
			changeDetection: 1
		});
	}
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AgFinancialCharts, [{
		type: Component,
		args: [{
			selector: "ag-financial-charts",
			standalone: true,
			template: "",
			encapsulation: ViewEncapsulation.None
		}]
	}], () => [{ type: ElementRef }, { type: NgZone }], {
		options: [{ type: Input }],
		chartReady: [{ type: Output }]
	});
})();
var AgGauge = class AgGauge extends AgChartsBase {
	constructor(elementDef, ngZone) {
		super();
		this.ngZone = ngZone;
		this.options = {
			type: "radial-gauge",
			value: 0
		};
		this.chartReady = new EventEmitter();
		this._nativeElement = elementDef.nativeElement;
	}
	createChart(options) {
		return AgCharts$1.createGauge(options);
	}
	static {
		this.ɵfac = function AgGauge_Factory(__ngFactoryType__) {
			return new (__ngFactoryType__ || AgGauge)(ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(NgZone));
		};
	}
	static {
		this.ɵcmp = /* @__PURE__ */ ɵɵdefineComponent({
			type: AgGauge,
			selectors: [["ag-gauge"]],
			inputs: { options: "options" },
			outputs: { chartReady: "chartReady" },
			features: [ɵɵInheritDefinitionFeature],
			decls: 0,
			vars: 0,
			template: function AgGauge_Template(rf, ctx) {},
			encapsulation: 2,
			changeDetection: 1
		});
	}
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AgGauge, [{
		type: Component,
		args: [{
			selector: "ag-gauge",
			standalone: true,
			template: "",
			encapsulation: ViewEncapsulation.None
		}]
	}], () => [{ type: ElementRef }, { type: NgZone }], {
		options: [{ type: Input }],
		chartReady: [{ type: Output }]
	});
})();
var AgChartsModule = class AgChartsModule {
	static {
		this.ɵfac = function AgChartsModule_Factory(__ngFactoryType__) {
			return new (__ngFactoryType__ || AgChartsModule)();
		};
	}
	static {
		this.ɵmod = /* @__PURE__ */ ɵɵdefineNgModule({
			type: AgChartsModule,
			imports: [
				AgCharts,
				AgFinancialCharts,
				AgGauge
			],
			exports: [
				AgCharts,
				AgFinancialCharts,
				AgGauge
			]
		});
	}
	static {
		this.ɵinj = /* @__PURE__ */ ɵɵdefineInjector({});
	}
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AgChartsModule, [{
		type: NgModule,
		args: [{
			declarations: [],
			imports: [
				AgCharts,
				AgFinancialCharts,
				AgGauge
			],
			exports: [
				AgCharts,
				AgFinancialCharts,
				AgGauge
			]
		}]
	}], null, null);
})();
//#endregion
export { AgCharts, AgChartsModule, AgFinancialCharts, AgGauge };
