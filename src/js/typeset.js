let partPromises = {};

export function addTexElement(elementId, tex) {
  partPromises[elementId] = 
      MathJax.tex2chtmlPromise(tex, { em: 64, ex: 16, display: false, scale: 2 }).then(
        nodeHtml => {
          const el = document.getElementById(elementId);
          if (el) {
            el.innerHTML = '';
            el.appendChild(nodeHtml);
          }
        });
}

export function typeset() {
  MathJax.typesetClear();
  Promise.all(Object.values(partPromises)).then(MathJax.typesetPromise()); //.then(createHovers);
}