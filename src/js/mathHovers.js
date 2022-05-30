export {createHovers, addHandlers};

const createHovers = function () {
    var myEvent = function (node) {
      node.addEventListener("mouseover", function (event) {
        const varname = node.classList[node.classList.length - 1].replace('varname-', '');
        console.log("Hovered over " + node.innerHTML + " name: " + varname)
      }, false);
    }
    // initial run if needed
    document.querySelectorAll(".hover").forEach(myEvent);
  
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.classList && node.classList.contains("hover")) {
            myEvent(node);
          }
          // TODO somehow the SVG subtree is not detected (tested Chrome, FF)
          // Workaround is to just udpated the children
          // (This could also replace the above in which case observerConfig could skip the subtree detection (for performancae))
          if (node.tagName === 'mjx-mi') {
            node.querySelectorAll('.hover').forEach(myEvent);
          }
        });
      });
    });
  
    var observerConfig = {
      childList: true,
      subtree: true
    };
  
    observer.observe(document.body, observerConfig);
  }
  
  
  const addHandlers = function (x) {
    if (x.name) {
      x.toTex =
        () => "\\class{hover varname-" + x.name + "}{" + x.name + "}";
    }
    return x;
  }
  