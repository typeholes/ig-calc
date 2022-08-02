import {
   isAssignmentNode,
   isFunctionAssignmentNode,
   MathNode,
} from 'mathjs';
import * as M from 'mathjs';
import { parse, } from '../js/math/mathUtil';


import { Set as ISet, } from 'immutable';

import { Errorable } from '../js/Either';

function unJS(expr: string) {
   return expr
      .replace(/\*\*/g, '^')
      .replace(/Math\.PI/g, 'pi')
      .replace(/Math\.E/g, 'e')
      .replace(/Math\./g, '')
      .replace(
         /const ([^=]+)=(.+)=>(.+)/,
         (match, name, args, body) => name + args + '=' + body
      )
      .replace(/const ([^=]+)=(.+)/, (match, name, body) => name + '=' + body);
}

export function parseNode(s: string): Errorable<MathNode> {
   return parse(unJS(s));
}

export interface ValidExpr {
   name: string;
   node: MathNode;
   vars: ISet<string>;
   showValue: boolean;
   description: string | undefined;
   showExpr: boolean;
}


export function getAssignmentBody(node: MathNode) {
   return isAssignmentNode(node) ? node.value : node;
}

export const getNodeName = (node: MathNode) =>
   isAssignmentNode(node) || isFunctionAssignmentNode(node)
      ? node.name
      : 'anon: ' + node.toString();

export function defaultCall(fn: M.FunctionAssignmentNode, names: Set<string>): MathNode {
   const name = fn.name;
   const args = fn.params.map( (x) => names.has(x) ? x : '__unused');
   const call = `${name}(${args.join(',')})`;
   return M.parse(call);
}
