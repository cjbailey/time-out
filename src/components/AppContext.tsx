import React, {
  createContext,
  PropsWithChildren,
  ReactElement,
  useContext,
  useEffect,
  useState
} from "react";
import IAppContext from "../interfaces/IAppContext";
import IAppSettings from "../interfaces/IAppSettings";
import IViewStackItem from "../interfaces/IViewStackItem";

const LS_SETTINGS = "clockit-settings";

const defaultAppContext: IAppContext = {
  settings: {
    updateInterval: 30000,
    timeFormat: "hh:mm:ss"
  },
  setUpdateInterval() {},
  setTimeFormat() {},
  pushView() {
    return Promise.reject("Not implemented");
  },
  popView() {}
};

const lsAppSettings = localStorage.getItem(LS_SETTINGS);
if (lsAppSettings) {
  defaultAppContext.settings = JSON.parse(lsAppSettings) as IAppSettings;
} else {
  localStorage.setItem(
    LS_SETTINGS,
    JSON.stringify({
      updateInterval: defaultAppContext.settings.updateInterval,
      timeFormat: defaultAppContext.settings.timeFormat
    })
  );
}

const _AppContext = createContext<IAppContext>(defaultAppContext);

const AppContext = (props: PropsWithChildren) => {
  const [updateInterval, setUpdateInterval] = useState(
    defaultAppContext.settings.updateInterval
  );
  const [timeFormat, setTimeFormat] = useState(
    defaultAppContext.settings.timeFormat
  );
  const [viewStack, setViewStack] = useState<IViewStackItem[]>([]);

  useEffect(() => {
    localStorage.setItem(
      LS_SETTINGS,
      JSON.stringify({
        updateInterval,
        timeFormat
      })
    );
  }, [updateInterval, timeFormat]);

  const pushView = async <T,>(component: ReactElement): Promise<T> => {
    return new Promise((resolver) => {
      setViewStack((prev) => {
        return [...prev, { component, resolver }];
      });
    });
  };

  const popView = (value?: any): void => {
    const lastView = viewStack.pop();
    if (lastView && lastView.resolver) {
      lastView.resolver(value);
    }
    setViewStack([...viewStack]);
  };

  return (
    <_AppContext.Provider
      value={{
        settings: {
          updateInterval,
          timeFormat
        },
        setUpdateInterval,
        setTimeFormat,
        pushView,
        popView
      }}
    >
      {props.children}
      {viewStack.map((view, index) => (
        <div key={`view-${index}`}>{view.component}</div>
      ))}
    </_AppContext.Provider>
  );
};

export function useAppContext() {
  const ctx = useContext<IAppContext>(_AppContext);
  return ctx;
}

export default AppContext;
