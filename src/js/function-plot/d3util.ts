/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { select } from 'd3-selection';
import { line } from 'd3-shape';
import { axisBottom, axisLeft } from 'd3-axis';
import { scaleLinear, scaleLog } from 'd3-scale';
import { zoom as d3Zoom, D3ZoomEvent, zoomIdentity } from 'd3-zoom';
import { interpolateRound } from 'd3-interpolate';
import { FunctionPlotData, FunctionPlotDatum } from './FunctionPlotDatum';
import { Interval, reverseInterval, unInterval } from './types';
import {
   defaultFunctionPlotOptionsAxis,
   FunctionPlotOptions,
} from './FunctionPlotOptions';
import { Rect } from '../Rect';
import { isValidPoint } from './utils';
import { Expand } from '../util';

const margins = { left: 10, right: 20, top: 0, bottom: 10 };

let nextGraphId = 0;
export function mkGraph(options: FunctionPlotOptions) {
   options.xAxis ??= defaultFunctionPlotOptionsAxis();
   options.yAxis ??= defaultFunctionPlotOptionsAxis();

   nextGraphId++;
   const id = `graph${nextGraphId}`;

   const graphRect = Rect(
      Interval(0, options.width ?? 400),
      Interval(0, options.height ?? 400)
   );
   const canvasRect = graphRect.margined(margins);

   const xDomain = options.xDomain ?? Interval(-10, 10);
   const yDomain = options.yDomain ?? Interval(-10, 10);

   const xScaleFn =
      (options.xAxis?.type ?? 'linear') === 'linear' ? scaleLinear : scaleLog;
   const xScale = xScaleFn().domain(unInterval(xDomain)).range(canvasRect.xA());

   const xAxis = axisBottom(xScale).tickSize(canvasRect.height());

   const yScale = scaleLinear()
      .domain(unInterval(reverseInterval(yDomain))) // TODO check if it is y and not x that needs to be reversed
      .range(canvasRect.yA());

   const yAxis = axisLeft(yScale).tickSize(canvasRect.width());

   //hold the original scales as zoom transforms are from the original scale
   //  not the modified scale
   const zoomScaleX = xScale.copy();
   const zoomScaleY = yScale.copy();

   //  const dragBox = () => canvas().select(".dragbox");

   const zoomer = d3Zoom().on('zoom', function (event) {
      if ('type' in event && event.type === 'zoom') {
         console.log(event.transform, zoomScaleX(1), xScale(1));
         const ze = event as D3ZoomEvent<SVGElement, unknown>;
         const newX = ze.transform
            .rescaleX(zoomScaleX)
            .interpolate(interpolateRound);
         const newY = ze.transform
            .rescaleY(zoomScaleY)
            .interpolate(interpolateRound);

         const xDomain = newX.domain();
         const yDomain = newY.domain();
         xScale.domain(xDomain).range(newX.range());
         yScale.domain(yDomain).range(newY.range());

         Interval.update(options.xDomain, xDomain);
         Interval.update(options.yDomain, yDomain);

         graph.drawAxis();
         graph.drawLines();
      }
   });
   const root = () => select(options.target).selectAll('svg').data([options]);
   root()
      .enter()
      .append('svg')
      .attr('width', graphRect.width)
      .attr('height', graphRect.height)
      .append('g')
      .attr('class', 'canvas')
      .attr(
         'transform',
         `translate(${canvasRect.left()},${canvasRect.top()}) `
      );

   const canvas = () => root().select('g.canvas');

   canvas()
      .append('g')
      .attr('class', 'content')
      .attr('clip-path', 'url(#function-plot-clip-' + id + ')');

   canvas()
      .append('g')
      .attr('class', ' x axis')
      .attr('transform', `translate(0,0) `);

   canvas()
      .append('g')
      .attr('class', ' y axis')
      .attr(
         'transform',
         `translate(${canvasRect.right()},-${canvasRect.top()}) `
      );

   root()
      .selectAll('text.title')
      .data([options.title])
      .join('text')
      //    .text((x) => x || "hmm, undefined")
      .attr('fill', '#999999')
      .attr('x', graphRect.width() / 2)
      .attr('y', 20)
      .attr('font-size', 25)
      .attr('class', 'title')
      .attr('alignment-baseline', 'middle')
      .attr('text-anchor', 'middle');

   canvas()
      .style('pointer-events', 'all')
      .append('rect')
      .attr('class', 'dragbox');

   const dragBox = canvas().select('.dragbox');

   dragBox
      // @ts-ignore
      .call(zoomer)
      .attr('x', '10')
      .attr('width', canvasRect.width())
      .attr('height', canvasRect.height())
      .style('fill', 'blue')
      .style('fill-opacity', '0')
      .style('pointer-events', 'all');
   //   .on("mousemove", function (event) {
   //     if ("buttons" in event && event.buttons === 1) {
   //       const p = pointer(event);
   //       console.log(p);
   //     }
   //   })
   // .on("mouseover", function (event) {
   //   console.log("moved");
   // })
   // .on("mouseout", function (event) {
   //   select(this).attr("fill", "green");
   //   console.log(event);
   // });

   function buildClip() {
      // (so that the functions don't overflow on zoom or drag)
      canvas()
         .append('defs')
         .append('clipPath')
         .attr('id', 'function-plot-clip-' + id)
         .append('rect')
         .attr('class', 'clip static-clip')
         .attr('width', canvasRect.width())
         .attr('height', canvasRect.height())
         // marker clip (for vectors)
         .append('clipPath')
         .append('marker')
         .attr('id', `${id}-marker`)
         .attr('viewBox', '0 -5 10 10')
         .attr('refX', 10)
         .attr('markerWidth', 5)
         .attr('markerHeight', 5)
         .attr('orient', 'auto')
         .append('svg:path')
         .attr('d', 'M0,-5L10,0L0,5L0,0')
         .attr('stroke-width', '0px')
         .attr('fill-opacity', 1)
         .attr('fill', '#777');
   }

   buildClip();

   function visibleData(data?: FunctionPlotData): FunctionPlotDatum[] {
      const ds: FunctionPlotDatum[] = [];
      if (!data) {
         return ds;
      }

      for (const k in data) {
         if ((data[k].show ?? true) && typeof data[k].evalFn === 'function') {
            ds.push(data[k]);
         }
      }
      return ds;
   }

   options.data ??= {};
   const graph = {
      runSampler: (name: string, numSamples: number) => {
         const d = options.data[name];
         return d.sample(
            Interval(...xScale.domain()),
            Interval(...yScale.range()),
            'linear',
            numSamples
         );
      },
      options: options ?? { data: {} },
      updateTitle: () => {
         root()
            .select('text.title')
            .text(options.title ?? '');
      },
      drawAxis: () => {
         const x = root()
            .select('.x.axis')
            //@ts-ignore
            .call(xAxis);

         x.selectAll('.domain').attr('stroke', 'black');

         x.selectAll('.tick')
            .data(function () {
               return select(this).selectChildren().select('text');
            })
            .select('line')
            .attr('opacity', (d) =>
               d && +select(d).text() === 0 ? '.5' : '.2'
            );

            x.selectAll('.tick').select('text').attr('opacity', '.3');
         const y = root()
            .select('.y.axis')
            //@ts-ignore
            .call(yAxis);

         y.selectAll('.domain').attr('stroke', 'black');
         y.selectAll('.tick')
            .data(function () {
               return select(this).selectChildren().select('text');
            })
            .select('line')
            .attr('opacity', (d) =>
               d && +select(d).text() === 0 ? '.5' : '.2'
         );

            y.selectAll('.tick').select('text').attr('opacity', '.3');
      },
      drawLines: () => {
         root()
            .select('g.content')
            .selectAll('g.line')
            .data(visibleData(options.data))
            .join('g')
            .attr('class', 'line')
            .attr('stroke', (d) => d.color ?? '#ff00ff')
            .attr('transform', `translate(0,-${canvasRect.top()}) `)
            .selectAll('path.line')
            .data((d) =>
               d.sample(
                  Interval(...xScale.domain()),
                  Interval(...yScale.range()),
                  'linear',
                  d.nSamples
               )
            )
            .join('path')
            .attr('class', 'line')
            .style('pointer-events', 'none')
            .attr('fill', 'none')
            .attr('stroke-width', '1')
            .attr('d', (ps) => {
               return line(
                  (p) => xScale(p[0]),
                  (p) => yScale(p[1])
               ).defined(isValidPoint)(ps);
            });
      },
      resetZoom: (xDomain: Interval, yCenter: number) => {
         const xDiff = Interval.span(xDomain);
         const scale = Math.abs(xDiff || 1);

         console.log({ xDomain, xDiff, yCenter });

         //@ts-ignore
         dragBox.call(zoomer.transform, zoomIdentity);
         //      zoomer.scaleTo(dragBox as never, 1)
         const xCenter = Interval.midpoint(xDomain);
         zoomer.translateTo(
            dragBox as never,
            zoomScaleX(xCenter),
            zoomScaleY(yCenter)
         );
         zoomer.scaleBy(dragBox as never, 1 / scale);
         //      xScale.domain(unInterval(xDomain)).range(canvasRect.xA());
      },
   };

   graph.drawAxis();
   graph.drawLines();

   return graph;
}

export type Graph = Expand<ReturnType<typeof mkGraph>>;
