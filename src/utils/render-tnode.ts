import Vue from 'vue';
import { PropType, CreateElement, VNode, RenderContext } from 'vue/types/umd';

// 组件render属性的ts类型
type RenderTsTypesSimple = string | number | boolean;
type RenderTsTypesObject = Record<string, any> | Array<any>;
type RenderTsTypes  = TNode | RenderTsTypesSimple | RenderTsTypesObject
// 组件render属性的js类型
const RenderJsTypes = [Function, String, Number, Boolean, Object, Array];

// 定义组件内容的渲染方式
enum RenderWay {
  Text = 'text',
  JsonString = 'jsonstring',
  VNode = 'vnode',
  Unknown = 'unknown'
}

/**
 * 根据传入的值（对象），判断渲染该值（对象）的方式
 * @param value 传入的值（对象）
 */
const getValueRenderWay = (value: RenderTsTypes): RenderWay => {
  // 简单类型
  if (['string', 'number', 'boolean'].includes(typeof value)) return RenderWay.Text;
  // 复杂对象
  if (['object'].includes(typeof value)) {
    // VNode类型的复杂对象
    if (value?.constructor?.name === 'VNode') return RenderWay.VNode;
    // 其他复杂对象或数组
    return RenderWay.JsonString;
  }
  // 未知类型（兜底）
  return RenderWay.Unknown;
};

// 通过template的方式渲染TNode
export const RenderTNodeTemplate = Vue.extend({
  name: 'render-tnode-template',
  functional: true,
  props: {
    render: RenderJsTypes as PropType<RenderTsTypes>,
  },
  render(h: CreateElement, ctx: RenderContext): VNode {
    const { render } = ctx.props;
    const renderResult = (typeof render === 'function') ? render(h, ctx.data.attrs) : render;
    const renderWay = getValueRenderWay(renderResult);

    // @ts-ignore
    const renderText = (c: RenderTsTypesSimple | RenderTsTypesObject) => ctx.__proto__._v(c);
    const renderMap = {};
    renderMap[RenderWay.Text] = (c: RenderTsTypesSimple) => renderText(c);
    renderMap[RenderWay.JsonString] = (c: RenderTsTypesObject) => renderText(JSON.stringify(c, null, 2));
    renderMap[RenderWay.VNode] = (c: VNode) => c;

    return renderMap[renderWay] ? renderMap[renderWay](renderResult) : h();
  },
});

// 通过JSX的方式渲染TNode
export const renderTNodeJSX = (vm: Vue, name: string) => {
  const propsNode = vm[name];
  if (typeof propsNode === 'function') return propsNode(vm.$createElement);
  if (!propsNode && vm.$scopedSlots[name]) return vm.$scopedSlots[name](null);
  return propsNode;
};
