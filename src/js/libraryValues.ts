import { Map as IMap } from "immutable";
import { SaveRep } from "../components/expressions";
import { SaveDescription, SaveId, SaveName } from './SaveManager';

interface Library {
  name: SaveName;
  description: SaveDescription;
  fns: Record<string, string>;
}

const Library = {
  addSaveRep: (library: Library): Library & { saveRep: SaveRep } => ({
    ...library,
    saveRep: IMap(library.fns)
      .map((expr) => ({ expr, show: false, color: "#FFFFFF" }))
      .toObject(),
  }),
};

const other: Library = {
  name: "other",
  description: "miscellaneous functions",
  fns: { zigZag: "1 - 2 acos(0.999 sin(2 pi x)) / pi" },
};

const libraries = [other];
const libraryMap = IMap(
  libraries.map((library) => [SaveId('local', library.name), library])
);

export const librarySaveReps = libraryMap.mapEntries(([name, library]) => [
  "library/" + name,
  { ...library, saveType: "local" },
]);

const metaEntries = libraries.map((library) => [SaveId('library', library.name), library.description] ) as [SaveId,SaveDescription][];
export const librarySaveMeta: IMap<SaveId, SaveDescription> = IMap(metaEntries);
