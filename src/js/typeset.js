/* eslint-disable */
let partPromises = {};

export function addTexElement(elementId, tex) {
  partPromises[elementId] =
    //    MathJax.tex2svgPromise(tex, {  display: true, scale: 1, lineWidth:5 }).then(
    MathJax.tex2chtmlPromise(tex, {
      display: true,
      scale: 1,
      lineWidth: 5,
    }).then((nodeHtml) => {
      const el = document.getElementById(elementId);
      if (el) {
        el.innerHTML = "";
        el.appendChild(nodeHtml);
      }
    });
}

export function typeset() {
  MathJax.typesetClear();
  void Promise.all(Object.values(partPromises)).then(MathJax.typesetPromise()); //.then(createHovers);
}