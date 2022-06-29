import { Map as IMap } from "immutable";
import { SaveRep } from "../components/expressions";
import { SaveDescription, SaveId, SaveName } from './SaveManager';

interface Library {
  name: SaveName;
  description: SaveDescription;
  fns: Record<string, [string, string]>;
}

const Library = {
  addSaveRep: (library: Library): Library & { saveRep: SaveRep } => ({
    ...library,
    saveRep: IMap(library.fns)
      .map(([expr,description]) => ({ expr, show: false, color: "#FFFFFF", description, showValue: false }))
      .toObject(),
  }),
};

const other: Library = {
  name: "other",
  description: "miscellaneous functions",
  fns: { zigZag: ["zigZag(x) = 1 - 2 acos(0.999 sin(2 pi x)) / pi", "ranges linerly between -1 and 1 per x"] },
};

const libraries = [other];
const libraryMap = IMap(
  libraries.map((library) => [SaveId('local', library.name), library])
);

export const librarySaveReps = 
  libraryMap.mapEntries(([id, library]) => [
  id.name,
    { ...library, fns: IMap(library.fns).map(([expr, description]) => ({ expr, description })).toObject() }
]);

const metaEntries = libraries.map((library) => [SaveId('library', library.name), library.description] ) as [SaveId,SaveDescription][];
export const librarySaveMeta: IMap<SaveId, SaveDescription> = IMap(metaEntries);
export const libraryDescriptions = librarySaveMeta.mapEntries( ([k,v]) => [k.name, v])
