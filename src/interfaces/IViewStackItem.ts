import { ReactElement } from "react";

export default interface IViewStackItem {
  component: ReactElement;
  resolver: (value: any) => void;
}
