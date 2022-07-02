import { isObject } from "@vue/shared";
import { isArray, sluDependencies } from "mathjs";
import { assert, defined, isString } from "./util";
import { addToEnv, checkNewExpr, state as appState } from "../components/uiUtil";

type Action = [string, string];

const actionHandlers : Record<string, ((x: string) => void) > = {
    alert: alert,
    addExpr: (x) => { appState.newExpr = x; checkNewExpr(); addToEnv(x, true); }
}

export function runAction([name,arg]: Action) {
    if (name in actionHandlers) {
        const fn = actionHandlers[name];
        fn(arg);
    } else {
        alert( `unknown action ${name}` )
    }
}
export let actions: Action[] | undefined = undefined;

export function getActions(name: string) { 
    const response = fetch(`${window.location.origin}/ig-calc/actions/${name}.json`);
    response.then(
        (response) => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            
            response.json().then((x) =>
                actions = parseActions(x)
            )
        })
    
}

function parseActions(json: unknown) : Action[] {
    const actions: Action[] = [];
    assert(isArray(json), 'actions must be a valid json array');
    json.forEach((x) => {
        assert.is(x, isObject); 
        Object.entries(x).forEach(([k, v]) => {
            if (isString(v) && defined(v)) {
                actions.push([k, v]);
            }
        })
    })
    return actions;
}