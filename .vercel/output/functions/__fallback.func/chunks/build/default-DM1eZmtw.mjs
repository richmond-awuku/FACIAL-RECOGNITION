import { _ as _plugin_vue_export_helper_default } from './_plugin-vue_export-helper-BOaGB7Aw.mjs';
import { mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderSlot } from 'vue/server-renderer';

//#region layouts/default.vue
var _sfc_main = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
	_push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen flex bg-gray-50" }, _attrs))}>`);
	ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
	_push(`</div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/default.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var default_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);

export { default_default as default };
//# sourceMappingURL=default-DM1eZmtw.mjs.map
