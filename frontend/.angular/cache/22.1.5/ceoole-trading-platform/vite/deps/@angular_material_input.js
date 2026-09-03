import { El as ɵɵdefineInjector, En as ElementRef, In as Input, Jo as ɵɵlistener, O as booleanAttribute, Pc as NgZone, Tc as InjectionToken, Ui as setClassMetadata, ba as ɵɵclassProp, ca as ɵɵNgOnChangesFeature, el as effect, ir as Renderer2, la as ɵɵProvidersFeature, ll as isSignal, no as ɵɵdefineNgModule, ol as inject, po as ɵɵdomProperty, qn as NgModule, to as ɵɵdefineDirective, va as ɵɵattribute, wn as Directive } from "./core-DK4zC9WD.js";
import { Qn as Subject } from "./esm5-ChK3bs0s.js";
import { t as BidiModule } from "./bidi-BcqBIoKc.js";
import { r as Platform } from "./_element-chunk-Bf7skS6x.js";
import { AutofillMonitor, TextFieldModule } from "./@angular_cdk_text-field.js";
import { FormGroupDirective, NgControl, NgForm, Validators } from "./@angular_forms.js";
import { n as getSupportedInputTypes } from "./_animation-chunk-Bxsl7L4N.js";
import { t as _IdGenerator } from "./_id-generator-chunk-WPlELa5n.js";
import { t as coerceBooleanProperty } from "./coercion-BM5FQA51.js";
import { c as MatFormField, d as MatLabel, f as MatPrefix, l as MatFormFieldControl, p as MatSuffix, r as MAT_FORM_FIELD, s as MatError, t as MatFormFieldModule, u as MatHint } from "./form-field-BtguErBv.js";
import { n as ErrorStateMatcher, r as FORM_FIELD, t as _ErrorStateTracker } from "./_error-state-chunk-B7F3yJf4.js";
//#region node_modules/@angular/material/fesm2022/_input-value-accessor-chunk.mjs
var MAT_INPUT_VALUE_ACCESSOR = new InjectionToken("MAT_INPUT_VALUE_ACCESSOR");
//#endregion
//#region node_modules/@angular/material/fesm2022/input.mjs
function getMatInputUnsupportedTypeError(type) {
	return Error(`Input type "${type}" isn't supported by matInput.`);
}
var MAT_INPUT_INVALID_TYPES = [
	"button",
	"checkbox",
	"file",
	"hidden",
	"image",
	"radio",
	"range",
	"reset",
	"submit"
];
var MAT_INPUT_CONFIG = new InjectionToken("MAT_INPUT_CONFIG");
var MatInput = class MatInput {
	_elementRef = inject(ElementRef);
	_platform = inject(Platform);
	ngControl = inject(NgControl, {
		optional: true,
		self: true
	});
	_autofillMonitor = inject(AutofillMonitor);
	_ngZone = inject(NgZone);
	_formField = inject(MAT_FORM_FIELD, { optional: true });
	_renderer = inject(Renderer2);
	_uid = inject(_IdGenerator).getId("mat-input-");
	_previousNativeValue;
	_inputValueAccessor;
	_signalBasedValueAccessor;
	_previousPlaceholder = null;
	_errorStateTracker;
	_config = inject(MAT_INPUT_CONFIG, { optional: true });
	_cleanupIosKeyup;
	_cleanupWebkitWheel;
	_isServer = false;
	_isNativeSelect = false;
	_isTextarea = false;
	_isInFormField = false;
	focused = false;
	stateChanges = new Subject();
	controlType = "mat-input";
	autofilled = false;
	get disabled() {
		return this._disabled;
	}
	set disabled(value) {
		this._disabled = coerceBooleanProperty(value);
		if (this.focused) {
			this.focused = false;
			this.stateChanges.next();
		}
	}
	_disabled = false;
	get id() {
		return this._id;
	}
	set id(value) {
		this._id = value || this._uid;
	}
	_id;
	placeholder;
	name;
	get required() {
		return this._required ?? this.ngControl?.control?.hasValidator(Validators.required) ?? false;
	}
	set required(value) {
		this._required = coerceBooleanProperty(value);
	}
	_required;
	get type() {
		return this._type;
	}
	set type(value) {
		this._type = value || "text";
		this._validateType();
		if (!this._isTextarea && getSupportedInputTypes().has(this._type)) this._elementRef.nativeElement.type = this._type;
	}
	_type = "text";
	get errorStateMatcher() {
		return this._errorStateTracker.matcher;
	}
	set errorStateMatcher(value) {
		this._errorStateTracker.matcher = value;
	}
	userAriaDescribedBy;
	get value() {
		return this._signalBasedValueAccessor ? this._signalBasedValueAccessor.value() : this._inputValueAccessor.value;
	}
	set value(value) {
		if (value !== this.value) {
			if (this._signalBasedValueAccessor) this._signalBasedValueAccessor.value.set(value);
			else this._inputValueAccessor.value = value;
			this.stateChanges.next();
		}
	}
	get readonly() {
		return this._readonly;
	}
	set readonly(value) {
		this._readonly = coerceBooleanProperty(value);
	}
	_readonly = false;
	disabledInteractive;
	get errorState() {
		return this._errorStateTracker.errorState;
	}
	set errorState(value) {
		this._errorStateTracker.errorState = value;
	}
	_neverEmptyInputTypes = [
		"date",
		"datetime",
		"datetime-local",
		"month",
		"time",
		"week"
	].filter((t) => getSupportedInputTypes().has(t));
	constructor() {
		const parentForm = inject(NgForm, { optional: true });
		const parentFormGroup = inject(FormGroupDirective, { optional: true });
		const defaultErrorStateMatcher = inject(ErrorStateMatcher);
		const accessor = inject(MAT_INPUT_VALUE_ACCESSOR, {
			optional: true,
			self: true
		});
		const formField = inject(FORM_FIELD, {
			optional: true,
			self: true
		});
		const element = this._elementRef.nativeElement;
		const nodeName = element.nodeName.toLowerCase();
		if (accessor) if (isSignal(accessor.value)) this._signalBasedValueAccessor = accessor;
		else this._inputValueAccessor = accessor;
		else this._inputValueAccessor = element;
		this._previousNativeValue = this.value;
		this.id = this.id;
		if (this._platform.IOS) this._ngZone.runOutsideAngular(() => {
			this._cleanupIosKeyup = this._renderer.listen(element, "keyup", this._iOSKeyupListener);
		});
		this._errorStateTracker = new _ErrorStateTracker(defaultErrorStateMatcher, formField || this.ngControl, parentFormGroup, parentForm, this.stateChanges);
		this._isServer = !this._platform.isBrowser;
		this._isNativeSelect = nodeName === "select";
		this._isTextarea = nodeName === "textarea";
		this._isInFormField = !!this._formField;
		this.disabledInteractive = this._config?.disabledInteractive || false;
		if (this._isNativeSelect) this.controlType = element.multiple ? "mat-native-select-multiple" : "mat-native-select";
		if (this._signalBasedValueAccessor) effect(() => {
			this._signalBasedValueAccessor.value();
			this.stateChanges.next();
		});
	}
	ngAfterViewInit() {
		if (this._platform.isBrowser) this._autofillMonitor.monitor(this._elementRef.nativeElement).subscribe((event) => {
			this.autofilled = event.isAutofilled;
			this.stateChanges.next();
		});
	}
	ngOnChanges() {
		this.stateChanges.next();
	}
	ngOnDestroy() {
		this.stateChanges.complete();
		if (this._platform.isBrowser) this._autofillMonitor.stopMonitoring(this._elementRef.nativeElement);
		this._cleanupIosKeyup?.();
		this._cleanupWebkitWheel?.();
	}
	ngDoCheck() {
		if (this.ngControl) {
			this.updateErrorState();
			if (this.ngControl.disabled !== null && this.ngControl.disabled !== this.disabled) {
				this.disabled = this.ngControl.disabled;
				this.stateChanges.next();
			}
		}
		this._dirtyCheckNativeValue();
		this._dirtyCheckPlaceholder();
	}
	focus(options) {
		this._elementRef.nativeElement.focus(options);
	}
	updateErrorState() {
		this._errorStateTracker.updateErrorState();
	}
	_focusChanged(isFocused) {
		if (isFocused === this.focused) return;
		if (!this._isNativeSelect && isFocused && this.disabled && this.disabledInteractive) {
			const element = this._elementRef.nativeElement;
			if (element.type === "number") {
				element.type = "text";
				element.setSelectionRange(0, 0);
				element.type = "number";
			} else element.setSelectionRange(0, 0);
		}
		this.focused = isFocused;
		this.stateChanges.next();
	}
	_onInput() {}
	_dirtyCheckNativeValue() {
		const newValue = this._elementRef.nativeElement.value;
		if (this._previousNativeValue !== newValue) {
			this._previousNativeValue = newValue;
			this.stateChanges.next();
		}
	}
	_dirtyCheckPlaceholder() {
		const placeholder = this._getPlaceholder();
		if (placeholder !== this._previousPlaceholder) {
			const element = this._elementRef.nativeElement;
			this._previousPlaceholder = placeholder;
			placeholder ? element.setAttribute("placeholder", placeholder) : element.removeAttribute("placeholder");
		}
	}
	_getPlaceholder() {
		return this.placeholder || null;
	}
	_validateType() {
		if (MAT_INPUT_INVALID_TYPES.indexOf(this._type) > -1 && (typeof ngDevMode === "undefined" || ngDevMode)) throw getMatInputUnsupportedTypeError(this._type);
	}
	_isNeverEmpty() {
		return this._neverEmptyInputTypes.indexOf(this._type) > -1;
	}
	_isBadInput() {
		let validity = this._elementRef.nativeElement.validity;
		return validity && validity.badInput;
	}
	get empty() {
		return !this._isNeverEmpty() && !this._elementRef.nativeElement.value && !this._isBadInput() && !this.autofilled;
	}
	get shouldLabelFloat() {
		if (this._isNativeSelect) {
			const selectElement = this._elementRef.nativeElement;
			const firstOption = selectElement.options[0];
			return this.focused || selectElement.multiple || !this.empty || !!(selectElement.selectedIndex > -1 && firstOption && firstOption.label);
		} else return this.focused && !this.disabled || !this.empty;
	}
	get describedByIds() {
		return this._elementRef.nativeElement.getAttribute("aria-describedby")?.split(" ") || [];
	}
	setDescribedByIds(ids) {
		const element = this._elementRef.nativeElement;
		if (ids.length) element.setAttribute("aria-describedby", ids.join(" "));
		else element.removeAttribute("aria-describedby");
	}
	onContainerClick() {
		if (!this.focused) this.focus();
	}
	_isInlineSelect() {
		const element = this._elementRef.nativeElement;
		return this._isNativeSelect && (element.multiple || element.size > 1);
	}
	_iOSKeyupListener = (event) => {
		const el = event.target;
		if (!el.value && el.selectionStart === 0 && el.selectionEnd === 0) {
			el.setSelectionRange(1, 1);
			el.setSelectionRange(0, 0);
		}
	};
	_getReadonlyAttribute() {
		if (this._isNativeSelect) return null;
		if (this.readonly || this.disabled && this.disabledInteractive) return "true";
		return null;
	}
	static ɵfac = function MatInput_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || MatInput)();
	};
	static ɵdir = /* @__PURE__ */ ɵɵdefineDirective({
		type: MatInput,
		selectors: [
			[
				"input",
				"matInput",
				""
			],
			[
				"textarea",
				"matInput",
				""
			],
			[
				"select",
				"matNativeControl",
				""
			],
			[
				"input",
				"matNativeControl",
				""
			],
			[
				"textarea",
				"matNativeControl",
				""
			]
		],
		hostAttrs: [1, "mat-mdc-input-element"],
		hostVars: 21,
		hostBindings: function MatInput_HostBindings(rf, ctx) {
			if (rf & 1) ɵɵlistener("focus", function MatInput_focus_HostBindingHandler() {
				return ctx._focusChanged(true);
			})("blur", function MatInput_blur_HostBindingHandler() {
				return ctx._focusChanged(false);
			})("input", function MatInput_input_HostBindingHandler() {
				return ctx._onInput();
			});
			if (rf & 2) {
				ɵɵdomProperty("id", ctx.id)("disabled", ctx.disabled && !ctx.disabledInteractive)("required", ctx.required);
				ɵɵattribute("name", ctx.name || null)("readonly", ctx._getReadonlyAttribute())("aria-disabled", ctx.disabled && ctx.disabledInteractive ? "true" : null)("aria-invalid", ctx.empty && ctx.required ? null : ctx.errorState)("aria-required", ctx.required)("id", ctx.id);
				ɵɵclassProp("mat-input-server", ctx._isServer)("mat-mdc-form-field-textarea-control", ctx._isInFormField && ctx._isTextarea)("mat-mdc-form-field-input-control", ctx._isInFormField)("mat-mdc-input-disabled-interactive", ctx.disabledInteractive)("mdc-text-field__input", ctx._isInFormField)("mat-mdc-native-select-inline", ctx._isInlineSelect());
			}
		},
		inputs: {
			disabled: "disabled",
			id: "id",
			placeholder: "placeholder",
			name: "name",
			required: "required",
			type: "type",
			errorStateMatcher: "errorStateMatcher",
			userAriaDescribedBy: [
				0,
				"aria-describedby",
				"userAriaDescribedBy"
			],
			value: "value",
			readonly: "readonly",
			disabledInteractive: [
				2,
				"disabledInteractive",
				"disabledInteractive",
				booleanAttribute
			]
		},
		exportAs: ["matInput"],
		features: [ɵɵProvidersFeature([{
			provide: MatFormFieldControl,
			useExisting: MatInput
		}]), ɵɵNgOnChangesFeature]
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatInput, [{
		type: Directive,
		args: [{
			selector: `input[matInput], textarea[matInput], select[matNativeControl],
      input[matNativeControl], textarea[matNativeControl]`,
			exportAs: "matInput",
			host: {
				"class": "mat-mdc-input-element",
				"[class.mat-input-server]": "_isServer",
				"[class.mat-mdc-form-field-textarea-control]": "_isInFormField && _isTextarea",
				"[class.mat-mdc-form-field-input-control]": "_isInFormField",
				"[class.mat-mdc-input-disabled-interactive]": "disabledInteractive",
				"[class.mdc-text-field__input]": "_isInFormField",
				"[class.mat-mdc-native-select-inline]": "_isInlineSelect()",
				"[id]": "id",
				"[disabled]": "disabled && !disabledInteractive",
				"[required]": "required",
				"[attr.name]": "name || null",
				"[attr.readonly]": "_getReadonlyAttribute()",
				"[attr.aria-disabled]": "disabled && disabledInteractive ? \"true\" : null",
				"[attr.aria-invalid]": "(empty && required) ? null : errorState",
				"[attr.aria-required]": "required",
				"[attr.id]": "id",
				"(focus)": "_focusChanged(true)",
				"(blur)": "_focusChanged(false)",
				"(input)": "_onInput()"
			},
			providers: [{
				provide: MatFormFieldControl,
				useExisting: MatInput
			}]
		}]
	}], () => [], {
		disabled: [{ type: Input }],
		id: [{ type: Input }],
		placeholder: [{ type: Input }],
		name: [{ type: Input }],
		required: [{ type: Input }],
		type: [{ type: Input }],
		errorStateMatcher: [{ type: Input }],
		userAriaDescribedBy: [{
			type: Input,
			args: ["aria-describedby"]
		}],
		value: [{ type: Input }],
		readonly: [{ type: Input }],
		disabledInteractive: [{
			type: Input,
			args: [{ transform: booleanAttribute }]
		}]
	});
})();
var MatInputModule = class MatInputModule {
	static ɵfac = function MatInputModule_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || MatInputModule)();
	};
	static ɵmod = /* @__PURE__ */ ɵɵdefineNgModule({
		type: MatInputModule,
		imports: [MatFormFieldModule, MatInput],
		exports: [
			MatInput,
			MatFormFieldModule,
			TextFieldModule,
			BidiModule
		]
	});
	static ɵinj = /* @__PURE__ */ ɵɵdefineInjector({ imports: [
		MatFormFieldModule,
		MatFormFieldModule,
		TextFieldModule,
		BidiModule
	] });
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatInputModule, [{
		type: NgModule,
		args: [{
			imports: [MatFormFieldModule, MatInput],
			exports: [
				MatInput,
				MatFormFieldModule,
				TextFieldModule,
				BidiModule
			]
		}]
	}], null, null);
})();
//#endregion
export { MAT_INPUT_CONFIG, MAT_INPUT_VALUE_ACCESSOR, MatError, MatFormField, MatHint, MatInput, MatInputModule, MatLabel, MatPrefix, MatSuffix, getMatInputUnsupportedTypeError };
