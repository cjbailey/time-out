import { ReactElement } from "react";
import IAppSettings from "./IAppSettings";

export default interface IAppContext {
  settings: IAppSettings;
  setUpdateInterval(interval: number): void;
  setTimeFormat(format: string): void;
  pushView<T>(view: ReactElement): Promise<T>;
  popView(value?: any): void;
}
