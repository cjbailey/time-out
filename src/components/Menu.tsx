import React from "react";
import MenuIcon from "../icons/menu-icon.svg?react";
import { useAppContext } from "./AppContext";
import Button from "./Button";
import Settings from "./Settings";

export default function Menu() {
  const appContext = useAppContext();

  const openSettings = async () => {
    if (appContext) {
      const view = <Settings />;
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
