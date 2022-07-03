import { Map as IMap } from "immutable";
import { SaveRep } from "../components/expressions";
import { SaveDescription, SaveId, SaveName } from "./SaveManager";

interface Library {
  name: SaveName;
  description: SaveDescription;
  fns: Record<string, [string, string]>;
}

const Library = {
  addSaveRep: (library: Library): Library & { saveRep: SaveRep } => ({
    ...library,
    saveRep: IMap(library.fns)
      .map(([expr, description]) => ({
        expr,
        show: false,
        color: "#FFFFFF",
        description,
        showValue: false,
        showExpr: true,
      }))
      .toObject(),
  }),
};

const periodic: Library = {
  name: "periodic",
  description: "periodic functions, useful for animationing variables",
  fns: {
    sinal: [
      "sinal(x, min, height, width) = min + height/2 * (1 + sin(2 pi x / width) )",
      "sin wave",
    ],
    zigZag: [
      "zigZag(x, min, height, width) = min + height * (acos(0.999 sin(2 pi x / width)) / pi)",
      "linear",
    ],
    min: ["min=1", ""],
    height: ["height=5", ""],
    width: ["width=5", ""],
  },
};

const libraries = [periodic];
export const libraryMap = IMap(
  libraries.map((library) => [SaveId("local", library.name), library])
);

export const librarySaveReps = libraryMap.mapEntries(([id, library]) => [
  id.name,
  {
    ...library,
    fns: IMap(library.fns)
      .map(([expr, description]) => ({ expr, description }))
      .toObject(),
  },
]);

const metaEntries = libraries.map((library) => [
  SaveId("library", library.name),
  library.description,
]) as [SaveId, SaveDescription][];
export const librarySaveMeta: IMap<SaveId, SaveDescription> = IMap(metaEntries);
export const libraryDescriptions = librarySaveMeta.mapEntries(([k, v]) => [
  k.name,
  v,
]);

export const libraryFns = libraryMap.mapEntries(([k, v]) => [k.name, v.fns]);
