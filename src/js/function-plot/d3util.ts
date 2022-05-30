import { pointer, select, selectAll } from "d3-selection";
import { line } from "d3-shape";
import { axisBottom, axisLeft } from "d3-axis";
import { scaleLinear } from "d3-scale";
import { isConstructorDeclaration } from "typescript";
import { zoom as d3Zoom, D3ZoomEvent } from "d3-zoom";
import { interpolateRound } from "d3-interpolate";
import { FunctionPlotData, FunctionPlotDatum } from "./FunctionPlotDatum";
import {
  Interval,
  offsetInterval,
  Point,
  Points,
  reverseInterval,
  unInterval,
} from "./types";
import { FunctionPlotOptions } from "../FunctionPlotOptions";
import { Rect } from "../Rect";
import { isValidNumber, isValidPoint, onNan } from "./utils";

const margins = { left: 10, right: 20, top: 30, bottom: 10 };

let nextGraphId = 0;
export function mkGraph(options: FunctionPlotOptions) {
  nextGraphId++;
  const id = `graph${nextGraphId}`;

  const graphRect = Rect(
    Interval(0, options.width ?? 400),
    Interval(0, options.height ?? 400)
  );
  const canvasRect = graphRect.margined(margins);

  const xDomain = options.xDomain ?? Interval(-10, 10);
  const yDomain = options.yDomain ?? Interval(-10, 10);

  const xScale = scaleLinear()
    .domain(unInterval(xDomain))
    .range(canvasRect.xA());

  const xAxis = axisBottom(xScale).tickSize(canvasRect.height());

  const yScale = scaleLinear()
    .domain(unInterval(reverseInterval(yDomain))) // TODO check if it is y and not x that needs to be reversed
    .range(canvasRect.yA());

  const yAxis = axisLeft(yScale).tickSize(canvasRect.width());

  const root = () => select(options.target).selectAll("svg").data([options]);
  root()
    .enter()
    .append("svg")
    .attr("width", graphRect.width)
    .attr("height", graphRect.height)
    .append("g")
    .attr("class", "canvas")
    .attr("transform", `translate(${canvasRect.left()},${canvasRect.top()}) `);

  const canvas = () => root().select("g.canvas");

  canvas()
    .append("g")
    .attr("class", "content")
    .attr("clip-path", "url(#function-plot-clip-" + id + ")");

  canvas()
    .append("g")
    .attr("class", " x axis")
    .attr("transform", `translate(0,0) `);

  canvas()
    .append("g")
    .attr("class", " y axis")
    .attr(
      "transform",
      `translate(${canvasRect.right()},-${canvasRect.top()}) `
    ); //

  root()
    .selectAll("text.title")
    .data([options.title])
    .join("text")
    .text((x) => x || "hmm, undefined")
    .attr("fill", "#999999")
    .attr("x", graphRect.width() / 2)
    .attr("y", 20)
    .attr("font-size", 25)
    .attr("class", "title")
    .attr("alignment-baseline", "middle")
    .attr("text-anchor", "middle");

  canvas()
    .style("pointer-events", "all")
    .append("rect")
    .attr("class", "dragbox")
    .attr("x", "10")
    .attr("width", canvasRect.width())
    .attr("height", canvasRect.height())
    .style("fill", "blue")
    .style("fill-opacity", "0")
    .style("pointer-events", "all")
    //   .on("mousemove", function (event) {
    //     if ("buttons" in event && event.buttons === 1) {
    //       const p = pointer(event);
    //       console.log(p);
    //     }
    //   })
    .on("mouseover", function (event) {
      console.log("moved");
    })
    .on("mouseout", function (event) {
      select(this).attr("fill", "green");
      console.log(event);
    });

  const dragBox = () => canvas().select(".dragbox");

  //hold the original scales as zoom transforms are from the original scale
  //  not the modified scale
  const zoomScaleX = xScale.copy();
  const zoomScaleY = yScale.copy();

  const zoomer = d3Zoom().on("zoom", function (event) {
    if ("type" in event && event.type === "zoom") {
      //      console.log(event);
      const ze = event as D3ZoomEvent<SVGElement, unknown>;
      const newX = ze.transform
        .rescaleX(zoomScaleX)
        .interpolate(interpolateRound);
      const newY = ze.transform
        .rescaleY(zoomScaleY)
        .interpolate(interpolateRound);

      xScale.domain(newX.domain()).range(newX.range());
      yScale.domain(newY.domain()).range(newY.range());

      graph.drawAxis();
      graph.drawLines();
    }
  });

  //@ts-ignore
  dragBox().call(zoomer);

  function buildClip() {
    // (so that the functions don't overflow on zoom or drag)
    canvas()
      .append("defs")
      .append("clipPath")
      .attr("id", "function-plot-clip-" + id)
      .append("rect")
      .attr("class", "clip static-clip")
      .attr("width", canvasRect.width())
      .attr("height", canvasRect.height())
      // marker clip (for vectors)
      .append("clipPath")
      .append("marker")
      .attr("id", `${id}-marker`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5L0,0")
      .attr("stroke-width", "0px")
      .attr("fill-opacity", 1)
      .attr("fill", "#777");
  }

  buildClip();

  function visibleData(data?: FunctionPlotData): FunctionPlotDatum[] {
    const ds: FunctionPlotDatum[] = [];
    if (!data) {
      return ds;
    }

    for (const k in data) {
      if ((data[k].show ?? true) && typeof data[k].evalFn === "function") {
        ds.push(data[k]);
      }
    }
    return ds;
  }

  const graph = {
    data: options.data ?? {},
    updateTitle: () => {
      root()
        .select("text.title")
        .text(options.title ?? "");
    },
    drawAxis: () => {
      root()
        .select(".x.axis")
        //@ts-ignore
        .call(xAxis)
        .selectAll(".tick")
        .data(function () {
          return select(this).selectChildren().select("text");
        })
        .select("line")
        .attr("opacity", (d) => (d && +select(d).text() === 0 ? ".5" : ".2"));

      root()
        .select(".y.axis")
        //@ts-ignore
        .call(yAxis)
        .selectAll(".tick")
        .data(function () {
          return select(this).selectChildren().select("text");
        })
        .select("line")
        .attr("opacity", (d) => (d && +select(d).text() === 0 ? ".5" : ".2"));
    },
    drawLines: () => {
      root()
        .select("g.content")
        .selectAll("g.line")
        .data(visibleData(options.data))
        .join("g")
        .attr("class", "line")
        .attr("stroke", (d) => d.color ?? "#ff00ff")
        .attr("transform", `translate(0,-${canvasRect.top()}) `)
        .selectAll("path.line")
        .data(
          (d) =>
            d.sample(
              Interval(...xScale.domain()),
              Interval(...yScale.range()),
              "linear",
              10000
            ) // TODO: linear and nSamples should not need to be specified here
        )
        .join("path")
        .attr("class", "line")
        .style("pointer-events", "none")
        .attr("fill", "none")
        .attr("stroke-width", "1")
        .attr("d", (ps) => {
          let lastValid: Point = [0, 0];
          ps.forEach((p, i) => {
            if (isValidPoint(p)) {
              lastValid = p;
            } else {
//              delete ps[i];
              // ps[i][0] =  onNan(ps[i][0], lastValid[0])
              // ps[i][1] =  onNan(ps[i][1], lastValid[1])
            }
          });
          return line(
            (p) => xScale(p[0]),
            (p) => yScale(p[1])
          )(ps.filter(isValidPoint));
        });
    },
  };

  graph.drawAxis();
  graph.drawLines();

  return graph;
}

export type Graph = ReturnType<typeof mkGraph>;
