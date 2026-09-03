import { Ui as setClassMetadata, dr as Service, io as ɵɵdefineService, lc as APP_ID, ol as inject } from "./core-DK4zC9WD.js";
//#region node_modules/@angular/cdk/fesm2022/_id-generator-chunk.mjs
var counters = /* @__PURE__ */ new Map();
var _IdGenerator = class _IdGenerator {
	_appId = inject(APP_ID);
	static _infix = `a${Math.floor(Math.random() * 1e5).toString()}`;
	getId(prefix, randomize = false) {
		if (this._appId !== "ng") prefix += this._appId;
		let count = counters.get(prefix);
		if (count === void 0) count = 0;
		else count++;
		counters.set(prefix, count);
		return `${prefix}${randomize ? _IdGenerator._infix + "-" : ""}${count}`;
	}
	static ɵfac = function _IdGenerator_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || _IdGenerator)();
	};
	static ɵprov = /* @__PURE__ */ ɵɵdefineService({
		token: _IdGenerator,
		factory: _IdGenerator.ɵfac
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(_IdGenerator, [{ type: Service }], null, null);
})();
//#endregion
export { _IdGenerator as t };
