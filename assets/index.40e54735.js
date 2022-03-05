var e=Object.defineProperty,t=(t,a,s)=>(((t,a,s)=>{a in t?e(t,a,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[a]=s})(t,"symbol"!=typeof a?a+"":a,s),s);import{_ as a,p as s,a as n,s as i,d as r,r as l,b as o,c,i as u,e as d,u as h,o as m,f as p,g,t as v,n as f,h as y,j as b,k as N,F as S,l as V,w as M,v as x,m as w,q as k,x as _,y as C,z as F,A as U,K as D,B as A}from"./vendor.ed09f8d9.js";!function(){const e=document.createElement("link").relList;if(!(e&&e.supports&&e.supports("modulepreload"))){for(const e of document.querySelectorAll('link[rel="modulepreload"]'))t(e);new MutationObserver((e=>{for(const a of e)if("childList"===a.type)for(const e of a.addedNodes)"LINK"===e.tagName&&"modulepreload"===e.rel&&t(e)})).observe(document,{childList:!0,subtree:!0})}function t(e){if(e.ep)return;e.ep=!0;const t=function(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerpolicy&&(t.referrerPolicy=e.referrerpolicy),"use-credentials"===e.crossorigin?t.credentials="include":"anonymous"===e.crossorigin?t.credentials="omit":t.credentials="same-origin",t}(e);fetch(e.href,t)}}();const B=function(e){return e.name&&(e.toTex=()=>"\\class{hover varname-"+e.name+"}{"+e.name+"}"),e};function O(e,t,s){a({target:e,title:s,yAxis:{domain:[-1,9]},grid:!0,data:[{fn:t,color:"purple",graphType:"polyline"}],tip:{renderer:function(e,t,a){return t.toString()}}})}function T(e,t){const a=e.indexOf(t);-1!==a&&e.splice(a,1)}function j(e){return e.filter(((e,t,a)=>a.indexOf(e)===t))}function q(e,t=8){if("number"!=typeof e)return e;return(e>1e3?e.toExponential(2):e.toFixed(2)).toString().replace("+","").padStart(t," ")}const E=s();function G(e,t){E.set(e,t)}function I(e,t,a={},s=Number.MAX_SAFE_INTEGER,i=1){if(e.content)return e.content=I(e.content,t,a,s,i+1),e;if(e.op)return e.args=e.args.map((e=>I(e,t,a,s,i+1))),e;if(e.fn){let d=H.get(e.fn);if(void 0===d||i>s)return e.args=e.args.map((e=>I(e,t,a,s,i))),e;for(var r=n(d.body),l={},o=0;o<d.argNames.length;o++){var c=d.argNames[o],u=e.args[o];l[c]=I(u,t,{...a},s,i+1)}return I(r,t,{...a,...l},s,i+1)}if(e.name){const s=a[e.name],i=t?s||E.get(e.name):s;if(void 0===i)try{const t=e.evaluate();return"number"==typeof t?n(t.toString()):e}catch(d){return e}return"object"==typeof i?i:n(i)}return e.value,e}function P(e){var t="Not Run";try{t=E.evaluate(e)}catch(a){t=a}return t}function R(e,t,a,s={}){return function(){let r=n(e),l=t?I(r,a,s):r;return i(l).transform(B).toTex({parenthesis:"keep",implicit:"hide"})}}function z(e,t,a={}){return function(){return function(e,t,a={}){var s=I(e,!0,a);return r(s,t)}(e,t,a).transform(B).toTex({parenthesis:"keep",implicit:"hide"})}}function J(e,t={}){return j(I(n(e),!1,t).filter((function(e){return e.isSymbolNode&&void 0!==E.get(e.name)})).map((e=>e.name)))}function L(e,t="",a="",s="",i,r={}){void 0!==t&&""!==t&&function(e,t,a="",s={}){!function(e){const t=e.map((e=>{var t=document.getElementById(e.id),a=e.toTex();return MathJax.tex2chtmlPromise(a,{em:64,ex:16,display:!1,scale:2}).then((e=>{t&&(t.innerHTML="",t.appendChild(e))}))}));MathJax.typesetClear(),Promise.all(t).then(MathJax.typesetPromise()).then(createHovers)}([{id:a+"pretty",toTex:R(e,!1,!1)},{id:a+"pretty-val",toTex:R(e,!0,!1,s)},{id:a+"derivative",toTex:z(e,t)},{id:a+"derivative-val",toTex:z(e,t,s)}])}(e.body,"x",t,r);const l=e.body,o=I(n(l),!0,r),c=j(o.filter((function(e){return e.isSymbolNode&&void 0!==E.get(e.name)})).map((e=>e.name)));if(c.length>1)throw"too many free variables in "+e.name+": "+c.join(", ");const u=c[0];O(a,("x"===u?"":u+"=x;")+o.toString(),(i[u]||u)+" -> "+s)}class W{constructor(e,a,s){t(this,"name"),t(this,"argNames"),t(this,"body"),t(this,"_fn"),this.name=e,this.argNames=a,this.body=s,this._fn=function(e){var t="Valid",a=null;try{a=E.evaluate(e)}catch(s){t=s}return{result:t,fn:a}}(this.defString()).fn}evalArgValues(e){return this.argNames.map((t=>P(e[t])))}argValues(e){return this.argNames.map((t=>e[t]))}signatureString(){return this.name+"("+this.argNames.join(",")+")"}defString(){return this.signatureString()+" = "+this.body}run(e){return this._fn(...this.evalArgValues(e))}callStr(e){return this.name+"("+this.argValues(e).join(",")+")"}callStrEvaluatedArgs(e){return this.name+"("+this.evalArgValues(e).join(",")+")"}}const Z=class{constructor(){t(this,"map",{});const e=new W("id",["x"],"x");this.map.id=e}static add(e){Z._instance.map[e.name]=e}static get(e){return Z._instance.map[e]}static create(e,t,a){const s=new W(e,t,a);return Z.add(s),s}static adjust(e,t,a){return this.create(t,e.argNames,a(e.body))}static makeUniqueSuffix(){this.uniqCnt++;return this.uniqCnt.toString().split("").map((e=>this.digitMap[e])).join("")+"_"}};let H=Z;t(H,"_instance",new Z),t(H,"uniqCnt",0),t(H,"digitMap",{1:"a",2:"b",3:"c",4:"d",5:"e",6:"f",7:"g",8:"h",9:"i",0:"j",".":"k","+":"l","-":"m",",":"n",e:"o"});class K{constructor(e,a,s,n,i){t(this,"name"),t(this,"displayName"),t(this,"visible"),t(this,"fn"),t(this,"args"),this.name=e,this.displayName=a,this.visible=s,this.fn=n,this.args=i}get value(){return this.fn.run(this.args)}spend(e){}dependsOn(e){return!(void 0===Object.values(this.args).find((t=>"string"==typeof t&&t.split(/[^a-zA-Z]/).includes(e))))}}const Y=class extends K{constructor(){super("t","Time",!1,H.get("id"),{x:"t"}),t(this,"time",0)}get value(){return this.time}};let $=Y;t($,"instance",new Y);class X extends K{}class Q extends K{constructor(e,a,s,n,i,r,l,o=n,c=i,u=!0){super(e,a,s,n,i),t(this,"_cntBought",0),t(this,"_totalBought",0),t(this,"currency"),t(this,"buyable",!0),t(this,"sellable",!1),t(this,"sellFn"),t(this,"sellArgs"),this.currency=r,this.sellable=l,this.buyable=u,this.sellFn=o,this.sellArgs=c}forceSetCounts(e,t){this._cntBought=e,this._totalBought=t}get cost(){return super.value}get sellCost(){return this.sellFn.run(this.sellArgs)}get value(){return this._cntBought}get totalBought(){return this._totalBought}buy(){this._cntBought++,this._totalBought++}spend(e){this._cntBought-=e}}class ee extends Q{constructor(e,t,a){const s=H.get("id"),n={x:e};super(e,t,a,s,n,"",!1,s,n,!1)}}const te={value:0,cost:0,sellCost:0,total:0};class ae{constructor(e,a,s){t(this,"uiState"),t(this,"uiStateMethods"),t(this,"milestoneManager"),t(this,"_items",{t:$.instance}),t(this,"_order",[]),t(this,"_dependencies",{}),t(this,"_deepDependencies",{}),t(this,"_dirty",[]),this.uiState=e,this.uiStateMethods=a,this.milestoneManager=s,this.add($.instance)}getUiVarField(e,t){const a="string"==typeof e?this.get(e):e;return"value"===t?a.value:"total"===t&&a instanceof Q?a.totalBought:"cost"===t&&a instanceof Q?a.cost:"sellCost"===t&&a instanceof Q?a.sellCost:NaN}setUiVarField(e,t,a=NaN){const s="string"==typeof e?this.get(e):e;"dirty"===a&&this._dirty.push(s.name);let n=a;("dirty"==n||isNaN(n))&&(n=this.getUiVarField(s,t)),this.uiStateMethods.varSetter(this.uiState,s.name,t,n),"value"===t&&(G(s.name,n),this.handleMilestoneUpdate(s.name))}setUiVarFields(e,t="clean"){const a="string"==typeof e?this.get(e):e;"dirty"===t&&this._dirty.push(a.name),this.setUiVarField(a,"cost"),this.setUiVarField(a,"sellCost"),this.setUiVarField(a,"value"),this.setUiVarField(a,"total")}newCalculation(e,t,a,s,n){const i=new X(e,t,a,s,n);return this.add(i),i}newPlain(e,t,a,s){const n=new ee(e,t,a);return this.add(n),n.spend(-1*s),n}newBuyable(e,t,a,s,n,i,r){const l=new Q(e,t,a,s,n,i,r);this.add(l),this.setUiVarField(l,"value"),this.setUiVarField(l,"cost");const o=this._items[i];return o instanceof X&&(o.fn=H.adjust(o.fn,e+"_"+i,(t=>t+" - "+s.callStr(n).replace(e,e+"_total")+" + "+s.callStrEvaluatedArgs(n)))),this.setUiVarField(o,"value","dirty"),l}add(e){var t,a;this.uiStateMethods.varAdder(this.uiState,e.name),this._dependencies[e.name]=[],this._calculateDependencies(e),this._deepDependencies[e.name]=(t=e.fn,a=e.args,t?J(t.body,a):[]),this._order.push(e.name),this._items[e.name]=e,this.setUiVarField(e,"value","dirty")}_calculateDependencies(e){for(const t in this._items)e.dependsOn(t)&&this._dependencies[t].push(e.name)}get(e){return this._items[e]}getNames(){return[...this._order]}tick(e){const t=this._items.t;t.time+=e,this.setUiVarField(t,"value",t.time),this._dirty.push("t");for(let a=0;a<2;a++){const e=[];this._order.forEach((t=>{if(this._dirty.includes(t)){const a=this._items[t];this.setUiVarFields(a),this._dirty.push(...this._dependencies[t]),e.push(t)}this._dirty=j(this._dirty),e.forEach((e=>{T(this._dirty,e)}))}))}}isBuyable(e){const t=this.get(e);return t instanceof Q&&t.buyable}isSellable(e){const t=this.get(e);return t instanceof Q&&t.sellable}getDependencies(e){const t=this._deepDependencies[e]||[],a=t.map((e=>this.getDependencies(e))).flat();return t.push(...a),t}getDependents(e){const t=[];return this._order.forEach((a=>{this._deepDependencies[a].includes(e)&&t.push(a)})),t}getCurrency(e){const t=this.get(e);if(t instanceof Q)return this.get(t.currency)}getCurrencyName(e){const t=this.getCurrency(e);return t?t.name:""}sell(e){const t=this.get(e);if(!(t instanceof Q))return;const a=this.getCurrencyName(e),s=this.get(a),n=t.cost;t.spend(1),this.setUiVarFields(t,"dirty"),s.spend(-1*n),this.setUiVarFields(s,"dirty")}buy(e){const t=this.get(e);if(!(t instanceof Q))return;const a=this.getCurrencyName(e),s=this.get(a),n=t.cost;n>this.getUiVarField(s,"cost")||(t.buy(),this.setUiVarFields(t,"dirty"),s.spend(n),this.setUiVarFields(s,"dirty"))}setFromUIValues(){this._order.forEach((e=>{const t=this._items[e];t instanceof Q?t.forceSetCounts(this.uiStateMethods.varGetter(this.uiState,e,"value"),this.uiStateMethods.varGetter(this.uiState,e,"total")):t instanceof $&&(t.time=this.uiStateMethods.varGetter(this.uiState,e,"value")),this._dirty.push(e),G(e,this.uiStateMethods.varGetter(this.uiState,e,"value")),this.handleMilestoneUpdate(e)}))}handleMilestoneUpdate(e){this.milestoneManager.handleUpdate(e).forEach((e=>{if(e.setVisible)for(let t in e.setVisible){this.get(t).visible=!0}if(e.setBuyable)for(let t in e.setBuyable){const e=this.get(t);e instanceof Q&&(e.buyable=!0)}if(e.setSellable)for(let t in e.setSellable){const e=this.get(t);e instanceof Q&&(e.sellable=!0)}if(e.storyPoint&&alert(e.storyPoint),e.adjustFunctions)for(let t in e.adjustFunctions)for(let a in e.adjustFunctions[t]){const s=e.adjustFunctions[t][a];this.adjustFnOf(t,a,s,"M")}}))}adjustFnOf(e,t,a,s){const n=this.get(e),i="_"+s+H.makeUniqueSuffix();let r,l;if("value"!==t||n instanceof Q)if("cost"===t&&n instanceof Q)r=n.fn,l=e=>n.fn=e;else{if(!("sellCost"===t&&n instanceof Q))throw"invalid fnType "+t+" for "+n.name;r=n.sellFn,l=e=>n.sellFn=e}else r=n.fn,l=e=>n.fn=e;l(H.adjust(r,r.name+i,(e=>a.replace("<&>",r.signatureString()))))}}class se{constructor(e){t(this,"saves",{}),t(this,"uiStateGetter"),this.uiStateGetter=e;const a=window.localStorage.getItem("matholeSaves");a?this.parseSaveStr(a):this.save("default")}save(e){this.buildNewSave(e),this.writeSaves()}load(e){return this.saves[e]}readSave(e){return!1}parseSaveStr(e){this.saves=JSON.parse(e)}writeSaves(){const e=JSON.stringify(this.saves);window.localStorage.setItem("matholeSaves",e)}buildNewSave(e){this.saves[e]=this.uiStateGetter()}}class ne{constructor(e,a,s,n="",i={}){t(this,"name"),t(this,"displayName"),t(this,"rewardtext"),t(this,"condition"),t(this,"rewardAction"),this.name=e,this.displayName=a,this.rewardtext=n,this.condition=s,this.rewardAction=i}check(){return P(this.condition)}}class ie{constructor(e,a){t(this,"milestoneMap",{}),t(this,"dependencies",{}),t(this,"uiState"),t(this,"uiStateMethods"),this.uiState=e,this.uiStateMethods=a}create(e,t,a,s="",n={}){const i=new ne(e,t,a,s,n);this.milestoneMap[e]=i;return J(a).forEach((t=>{var a;(a=this.dependencies)[t]||(a[t]=[]),this.dependencies[t].push(e)})),i}handleUpdate(e){const t=this.dependencies[e];if(!t)return[];const a=[];return t.forEach((e=>{if(this.milestoneReached(e))return;const t=this.milestoneMap[e];t.check()&&(this.setReached(e),a.push(t.rewardAction))})),a}milestoneReached(e){return this.uiStateMethods.milestoneGetter(this.uiState,e)}setReached(e){this.uiStateMethods.milestoneSetter(this.uiState,e,!0)}getNames(){return Object.keys(this.milestoneMap)}get(e){return this.milestoneMap[e]}}const re=class{constructor(e,a,s){t(this,"canTick",!0),t(this,"gameVarManager"),t(this,"saveManager"),t(this,"milestoneManager"),t(this,"uiState"),t(this,"uiStateMethods"),this.uiState=e,this.uiStateMethods=a,this.milestoneManager=new ie(e,a),this.gameVarManager=new ae(e,a,this.milestoneManager),s(this.gameVarManager,H,this.milestoneManager),this.saveManager=new se((()=>this.uiStateMethods.cloner(this.uiState)))}static init(e,t,a){return re._instance=new re(e,t,a),e}static getInstance(){return re._instance}displayFunction(e,t,a,s){const n=this.gameVarManager.get(e);L(n.fn,"",t,s,a,n.args)}getNameMap(){const e={};return this.gameVarManager.getNames().forEach((t=>e[t]=this.getDisplayName(t))),e}getNames(){return this.gameVarManager.getNames()}tick(e){this.canTick&&(this.canTick=!1,this.gameVarManager&&this.gameVarManager.tick(e),this.canTick=!0)}getDisplayName(e){return""===e?"WTF!":this.gameVarManager.get(e).displayName}isVisible(e){return this.gameVarManager.get(e).visible}buy(e){this.gameVarManager.buy(e)}sell(e){this.gameVarManager.sell(e)}isSellable(e){return this.gameVarManager.isSellable(e)}isBuyable(e){return this.gameVarManager.isBuyable(e)}getCurrencyName(e){return this.gameVarManager.getCurrencyName(e)}getCurrencyDisplayName(e){return""===e?"":this.getDisplayName(this.getCurrencyName(e))}getDependencies(e){return this.gameVarManager.getDependencies(e)}getDependents(e){return this.gameVarManager.getDependents(e)}getMilestoneNames(){return this.milestoneManager.getNames()}getMilestoneDisplayName(e){return this.milestoneManager.get(e).displayName}getMilestoneReward(e){return this.milestoneManager.get(e).rewardtext}getMilestoneCondition(e){return this.milestoneManager.get(e).condition}save(){this.canTick=!1,this.saveManager.save("default"),this.canTick=!0}load(){this.canTick=!1;const e=this.saveManager.load("default").vars;for(const t in e){const a=e[t].value,s=e[t].cost,n=e[t].cost,i=e[t].total;this.gameVarManager.setUiVarField(t,"value",a),this.gameVarManager.setUiVarField(t,"cost",s),this.gameVarManager.setUiVarField(t,"sellCost",n),this.gameVarManager.setUiVarField(t,"total",i)}this.gameVarManager.setFromUIValues(),this.canTick=!0}};let le=re;var oe,ce;function ue(...e){const t={};return e.forEach((e=>t[e]=u(e)())),t}t(le,"_instance"),(ce=oe||(oe={})).ClickAction="clickAction",ce.GraphedVarName="graphedVarName",ce.SelectedVarName="selectedVarName",ce.Dependencies="dependencies",ce.Dependents="dependents",ce.ClickActions="clickActions";const de=l({vars:{},milestones:{}}),he={cloner:e=>e,varAdder:(e,t)=>e.vars[t]=l({...te}),varGetter:(e,t,a)=>e.vars[t][a],varSetter:(e,t,a,s)=>e.vars[t][a]=s,milestoneGetter:(e,t)=>e.milestones[t],milestoneSetter:(e,t,a)=>e.milestones[t]=a};function me(e){return de.vars[e].value}function pe(e){return de.vars[e].sellCost}function ge(e){return de.vars[e].cost}function ve(e){return de.milestones[e]}const fe={key:0,class:"gamevar"},ye={class:"label"},be={class:"value"},Ne={class:"buy"},Se=["disabled"],Ve={class:"sell"},Me=["disabled"];var xe=d({props:{varName:{type:String,required:!0},forceVisible:{type:Boolean,required:!0,default:!1}},setup(e){const{clickAction:t,dependencies:a,dependents:s,graphedVarName:n,selectedVarName:i}=ue(oe.ClickAction,oe.Dependencies,oe.Dependents,oe.GraphedVarName,oe.SelectedVarName),r=le.getInstance();function l(e){const t=r.getCurrencyName(e);if(!t)return!1;return me(t)>=ge(e)}function o(e,t,a,s){let n={marker:!0,dependent:!1,depends:!1,hidden:!0,inline:!0};return e===t?(n.hidden=!1,n):(a.includes(e)&&(n.dependent=!0,n.hidden=!1),s.includes(e)&&(n.depends=!0,n.hidden=!1),n)}function c(e){return(r.isBuyable(e)?"Cost of ":"")+r.getDisplayName(e)}return(u,d)=>{return e.forceVisible||h(r).isVisible(e.varName)?(m(),p("div",fe,[g("div",{class:f(o(e.varName,h(i),h(a),h(s)))},[g("span",null,v(e.varName===h(i)?"⊜":"⇒"),1)],2),g("div",ye,[g("span",{onClick:d[0]||(d[0]=l=>function(e){if("select"===t.value){i.value=e;let t=r.getDependencies(e),n=r.getDependents(e);a.value=t,s.value=n}"graph"===t.value&&(n.value=e,r.displayFunction(e,"#test-graph-expr",r.getNameMap(),c(e)))}(e.varName))},v(h(r).getDisplayName(e.varName))+": ",1)]),g("div",be,v(h(q)(h(me)(e.varName))),1),g("div",Ne,[h(r).isBuyable(e.varName)?(m(),p("button",{key:0,onClick:d[1]||(d[1]=t=>{return a=e.varName,s=h(n),r.buy(a),void(""!==s&&r.displayFunction(s,"#test-graph-expr",r.getNameMap(),c(s)));var a,s}),disabled:!l(e.varName)}," Buy: "+v(h(q)(h(ge)(e.varName)))+" "+v(h(r).getCurrencyDisplayName(e.varName)),9,Se)):y("",!0)]),g("div",Ve,[h(r).isSellable(e.varName)?(m(),p("button",{key:0,onClick:d[2]||(d[2]=t=>{return a=e.varName,s=h(n),r.sell(a),void(""!==s&&r.displayFunction(s,"#test-graph-expr",r.getNameMap(),c(s)));var a,s}),disabled:(b=e.varName,!(me(b)>0))},"Sell: "+v(h(q)(h(pe)(e.varName)))+" "+v(h(r).getCurrencyDisplayName(e.varName)),9,Me)):y("",!0)])])):y("",!0);var b}}});const we={class:"game"},ke={class:"mainVar"},_e={class:"vars"},Ce={class:"contents"},Fe=g("div",{id:"test-graph-expr",class:"graphDiv"},null,-1);var Ue=d({setup(e){const t=le.getInstance(),{dependencies:a,dependents:s,graphedVarName:n,selectedVarName:i}=ue(oe.Dependencies,oe.Dependents,oe.GraphedVarName,oe.SelectedVarName);return(e,r)=>(m(),p("div",we,[g("div",ke,[b(xe,{varName:"t",dependencies:h(a),"onUpdate:dependencies":r[0]||(r[0]=e=>N(a)?a.value=e:null),dependents:h(s),"onUpdate:dependents":r[1]||(r[1]=e=>N(s)?s.value=e:null),forceVisible:"",graphedVarName:h(n),"onUpdate:graphedVarName":r[2]||(r[2]=e=>N(n)?n.value=e:null),selectedVarName:h(i),"onUpdate:selectedVarName":r[3]||(r[3]=e=>N(i)?i.value=e:null)},null,8,["dependencies","dependents","graphedVarName","selectedVarName"]),b(xe,{varName:"money",dependencies:h(a),"onUpdate:dependencies":r[4]||(r[4]=e=>N(a)?a.value=e:null),dependents:h(s),"onUpdate:dependents":r[5]||(r[5]=e=>N(s)?s.value=e:null),forceVisible:"",graphedVarName:h(n),"onUpdate:graphedVarName":r[6]||(r[6]=e=>N(n)?n.value=e:null),selectedVarName:h(i),"onUpdate:selectedVarName":r[7]||(r[7]=e=>N(i)?i.value=e:null)},null,8,["dependencies","dependents","graphedVarName","selectedVarName"])]),g("div",_e,[(m(!0),p(S,null,V(h(t).getNames(),(e=>(m(),p("div",Ce,[b(xe,{varName:e,dependencies:h(a),"onUpdate:dependencies":r[8]||(r[8]=e=>N(a)?a.value=e:null),dependents:h(s),"onUpdate:dependents":r[9]||(r[9]=e=>N(s)?s.value=e:null),graphedVarName:h(n),"onUpdate:graphedVarName":r[10]||(r[10]=e=>N(n)?n.value=e:null),selectedVarName:h(i),"onUpdate:selectedVarName":r[11]||(r[11]=e=>N(i)?i.value=e:null)},null,8,["varName","dependencies","dependents","graphedVarName","selectedVarName"])])))),256))]),Fe]))}}),De=d({props:{name:{type:String,required:!0}},setup(e){const t=le.getInstance();return(a,s)=>(m(),p("div",{class:f({milestone:!0,reached:h(ve)(e.name)})},v(h(t).getMilestoneDisplayName(e.name))+": "+v(h(t).getMilestoneCondition(e.name))+" "+v(h(t).getMilestoneReward(e.name)),3))}});const Ae={class:"milestones"},Be={class:"contents"};var Oe=d({setup(e){const t=le.getInstance();return(e,a)=>(m(),p("div",Ae,[(m(!0),p(S,null,V(h(t).getMilestoneNames(),(e=>(m(),p("div",Be,[b(De,{name:e},null,8,["name"])])))),256))]))}});const Te=w(" function: "),je=g("div",{id:"view-fn-graph-expr",class:"graphDiv"},null,-1);var qe=d({setup(e){let t=o("x"),a=o("x");function s(){let e=n(t.value);O("#view-fn-graph-expr",I(e,!0,{}).toString(),"0"),a.value=I(e,!0,{},1).toString()}function i(){t.value=a.value,s()}return(e,n)=>(m(),p("div",null,[Te,M(g("input",{"onUpdate:modelValue":n[0]||(n[0]=e=>N(t)?t.value=e:t=e),onChange:s,size:"50"},null,544),[[x,h(t)]]),w(" expanded: "+v(h(a))+" ",1),g("button",{onClick:i},"replace with expanded"),je]))}});function Ee(e,t,a){const s=t.get("id"),n=t.create("times",["x","b"],"x*b");t.create("reciprical",["x"],"1/(x+1)"),t.create("zigZag",["x"],"1-2 * acos((1- smoother) * sin(2 * pi * x))/pi"),t.create("squareWave",["x"],"2 * atan( sin(2 * pi * x)/ smoother )/pi"),t.create("sawtooth",["x"],"(1+zigZag((2 * x - 1)/4) * squareWave(x/2))/2"),t.create("steps",["x"],"x - sawtooth(x)"),t.create("logSquares",["x","b"],"log(x^2+b^2)"),t.create("curvedSawtooth",["x"],"logSquares(x^smoother,sawtooth(x))");const i=t.create("calcMarketValue",["x"],"curvedSawtooth(x)*(marketScale+1)");e.newPlain("money","$",!1,1),e.newBuyable("stability","Market Stability",!0,n,{x:1.25,b:"stability+2/1.25"},"money",!1),e.newBuyable("marketScale","Market Scale",!0,n,{x:2,b:"marketScale+1"},"stability",!1),e.newCalculation("smoother","Smoother",!1,n,{x:"stability",b:.01}),e.newCalculation("marketValue","Market Value",!0,i,{x:"t"}),e.newBuyable("shares","Shares",!0,s,{x:"marketValue"},"money",!0),e.newCalculation("dummy","dummy",!0,s,{x:"2^(t*10)"}),e.newBuyable("sdummy","Dummy",!0,s,{x:"dummy"},"money",!0),a.create("startStory","Went Bankrupt","t > 0","You start the game from scratch",{storyPoint:"You went bankrupt. All you have left is your library card and a dollar's worth of coins you found in the gutter. Time to head to the library, grab a computer, and login to jankyMarketTrader.com"}),a.create("tooStable","Too Stable?","stability > 3"," Can sell Market Stability",{setSellable:{stability:!0}}),a.create("scaled","Insider Trading","marketScale >= 1"," Better price when selling shares ",{adjustFunctions:{shares:{sellCost:" 1.1 * <&>"}}})}var Ge=d({props:{labelOn:{type:String,required:!0},labelOff:{type:String,required:!0,default:""},colorOn:{type:String,required:!0,default:"#dee7a7"},colorOff:{type:String,required:!0,default:"#dee7a7"},valueOn:{type:null,required:!0,default:!0},valueOff:{type:null,required:!0,default:!1}},emits:["update:value"],setup(e){const t=o(!0);return(a,s)=>(m(),p("button",{style:k({backgroundColor:t.value?e.colorOn:e.colorOff}),onClick:s[0]||(s[0]=s=>{t.value=!t.value,a.$emit("update:value",t.value?e.valueOn:e.valueOff)})},v(t.value?e.labelOn:e.labelOff||e.labelOn),5))}});const Ie={class:"mathole"},Pe={class:"topbar"},Re={class:"sidebar"},ze=w(" Click Action "),Je={class:"mainPain"};var Le=d({setup(e){le.init(de,he,Ee);const t=le.getInstance(),{clickAction:a,graphedVarName:s,selectedVarName:n,dependencies:i,dependents:r}=function(...e){const t={};return e.forEach((([e,a])=>{const s=o(a);c(e,(()=>s)),t[e]=s})),t}([oe.ClickAction,"select"],[oe.GraphedVarName,""],[oe.SelectedVarName,""],[oe.Dependencies,[]],[oe.Dependents,[]]),l=_(Ue);function u(e){l.value=e}let d=0;function v(e){const a=e-d;t.canTick&&a>=500&&(t.tick(a/1e4),d=e),window.requestAnimationFrame(v)}return C((()=>{console.log("mounted "),window.requestAnimationFrame(v)})),(e,i)=>(m(),p("div",Ie,[g("div",Pe,[g("button",{onClick:i[0]||(i[0]=e=>u(Ue))},"Game"),g("button",{onClick:i[1]||(i[1]=e=>u(Oe))},"Milestones"),g("button",{onClick:i[2]||(i[2]=(...e)=>h(t).save&&h(t).save(...e))},"save"),g("button",{onClick:i[3]||(i[3]=(...e)=>h(t).load&&h(t).load(...e))},"load"),g("button",{onClick:i[4]||(i[4]=e=>u(qe))},"Function Viewer")]),g("div",Re,[ze,b(Ge,{labelOn:"Select",labelOff:"Graph",valueOn:"select",valueOff:"graph",value:h(a),"onUpdate:value":i[5]||(i[5]=e=>N(a)?a.value=e:null)},null,8,["value"])]),g("div",Je,[(m(),F(D,null,[(m(),F(U(h(l)),{selectedVarName:h(n),"onUpdate:selectedVarName":i[6]||(i[6]=e=>N(n)?n.value=e:null),graphedVarName:h(s),"onUpdate:graphedVarName":i[7]||(i[7]=e=>N(s)?s.value=e:null)},null,8,["selectedVarName","graphedVarName"]))],1024))])]))}});const We={setup(e){var t={};return c("appAddViewMap",(function(e,a,s,n=t){n[e]||(n[e]={}),n[e][a]=s})),c("appGetView",(function(e,a,s=t){return s[e][a]})),(e,t)=>(m(),F(Le))}};window.global={},A(We).mount("#app");
