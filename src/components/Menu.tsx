import React, { Dispatch } from "react";
import MenuIcon from "../icons/menu-icon.svg?react";
import IWorkListAction from "../interfaces/IWorkListAction";
import IWorkListItem from "../interfaces/IWorkListItem";
import { useAppContext } from "./AppContext";
import Button from "./Button";
import Settings from "./Settings";

interface IProps {
  workItems: IWorkListItem[];
  workItemDispatcher: Dispatch<IWorkListAction>;
}

export default function Menu({ workItems, workItemDispatcher }: IProps) {
  const appContext = useAppContext();

  const openSettings = async () => {
    if (appContext) {
      const view = (
        <Settings
          workItems={workItems}
          workItemDispatcher={workItemDispatcher}
        />
      );
      await appContext.pushView(view);
    }
  };

  return (
    <div className="app-menu">
      <Button className="menu-btn" onClick={openSettings}>
        <MenuIcon width="1.5em" className="menu-icon" />
      </Button>
    </div>
  );
}
