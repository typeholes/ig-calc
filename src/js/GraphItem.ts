import { MathNode } from 'mathjs';
import { Set as ISet } from 'immutable';
import { Datum, DatumOptions, EvalFn } from './function-plot/FunctionPlotDatum';

export interface GraphItem {
   type: 'node' | 'constant';
   name: string;
   color: `#${string}`;
   hidden: boolean;
   showGraph: boolean;
   showValue: boolean;
   description: string | undefined;
}

export const defaultGraphItemValues: Omit<Omit<GraphItem,'type'>, 'name'> = {
   color: '#FFFF00',
   hidden: false,
   showGraph: false,
   showValue: false,
   description: undefined
}

export interface GraphConstant extends GraphItem {
   type: 'constant';
   value: number;
}

export interface Expression {
   node: MathNode;
   vars: ISet<string>;
}

export interface GraphExpression extends GraphItem {
   type: 'node';
   expression: Expression;
}

export const GraphNode = (
   item: Omit<GraphItem, 'type'>,
   expression: Expression
): GraphExpression => ({
   type: 'node',
   ...item,
   expression,
});

export const GraphConstant = (
   item: Omit<GraphItem, 'type'>,
   value: number
): GraphConstant => ({
   type: 'constant',
   ...item,
   value,
});

const GraphItemBase = {
   toDatum: (item: GraphItem, evalFn: EvalFn, options: Partial<DatumOptions> = {}) => Datum( evalFn, { show: item.showGraph, color: item.color, ...options}),
} as const;

GraphConstant.toDatum = (item: GraphConstant) => GraphItemBase.toDatum(item, () => item.value, {nSamples: 2})
