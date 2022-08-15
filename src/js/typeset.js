/* eslint-disable */
let partPromises = {};

export function addTexElement(elementId, tex, id2  ) {
  console.log({ elementId, id2, tex });
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
      const el2 = document.getElementById(id2);
      if (el2) {
        el2.innerHTML = "";
        el2.appendChild(nodeHtml);
      }
    });
}

export function typeset() {
  MathJax.typesetClear();
  void Promise.all(Object.values(partPromises)).then(MathJax.typesetPromise()); //.then(createHovers);
}
