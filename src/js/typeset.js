/* eslint-disable */
import { reactive } from 'vue';

let nodes = reactive({});

export function getTex(id) {
  const node = nodes[id];
  return node ? node.outerHTML : `<span>${id} not found</span>`;
}

export function injectTex(elementId, tgt, skipTypeset) {
  const el = document.getElementById(tgt ?? elementId);
  if (el) {
    el.innerHTML = '';
    el.appendChild(nodes[elementId]);
    if (!skipTypeset) {
      MathJax.typeset();
    }
  }
}

export function addTexElement(elementId, tex) {
  nodes[elementId] = MathJax.tex2svg(tex, {
    display: true,
    scale: 1,
    lineWidth: 5,
  });
}
