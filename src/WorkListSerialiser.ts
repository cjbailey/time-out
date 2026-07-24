import ISerialisedTime from "./interfaces/ISerialisedTime";
import IWorkListItem from "./interfaces/IWorkListItem";
import Time from "./types/Time";

export function Serialise(obj: IWorkListItem[]): string {
  return JSON.stringify(obj);
}

export function Deserialise(json: string | null): IWorkListItem[] {
  if (json === null) {
    return [];
  }

  const obj = JSON.parse(json, (key: string, value: any) => {
    const workListItem = value as ISerialisedTime;
    switch (key) {
      case "startTime":
      case "lastStartTime":
      case "elapsedTime":
        return new Time(workListItem.timeInMs);

      default:
        return value;
    }
  });

  if (!Array.isArray(obj)) {
    return [];
  }

  return obj.map((item) => ({
    ...item,
    folder: (item.folder || "General").trim() || "General"
  }));
}
