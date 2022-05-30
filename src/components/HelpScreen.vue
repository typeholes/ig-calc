<template>
  <div class="help">
    <hr />
    known issues<br />
    Integration only works for very simple cases<br />
    loading is broken <br />
    complex graphs can change when dragging the graph to pan, I think this is
    just aliasing<br />
    cyclic dependency checking isn't done<br />
    functions evaluating to NaN cause path generation to error, which is not
    handled
    <hr />
    Todo List<br />
    Actually format the list of builtin functions<br />
    The list of builtins should be a library feature, with documentation and
    click to add to current expression<br />
    sliders for free variable values per expression, so you don't have to add a
    global definition to graph something<br />
    multiple graphs? add a <u>derivative</u> function<br />
    add builtin functions for common incremental game concepts like
    sumOfPowers<br />
    cyclic dependency checking<br />
    fix loading<br />
    export/import<br />
    pan graph to intersection of 2 functions<br />
    pan and zoom graph to encompass a pair of intersections<br />
    implement mouse tips for the graph<br />
    <hr />
    <h2><b>Thanks</b></h2>
    <br />
    <h2>@KevinAttemptsDeving</h2>
    for telling me to go for it when I said I should just implement my own
    graphing calculator
    <h2>@Galefury</h2>
    for taking the time to review the alpha versions and all the valuable
    feedback
    <h2>@n_n</h2>
    for guidance and trying to find a better CAS<br />
    Also, for all the utterly acursed code - it brings me much joy
    <hr />
    Indespencible Dependencies<br />
    <a href="https://mathjs.org/">MathJs</a><br />
    <hr />
    Other<br />
    <a href="https://mauriciopoppe.github.io/function-plot/">Function Plot</a>
    the basis for my function plotting utilities
    <br />
    <hr />
    Change Log
    <pre>
      rewrote and (overly) simplified function-plot
      added bugs
      </pre
    >
  </div>
</template>
