import React, {
  ChangeEvent,
  Dispatch,
  KeyboardEvent,
  useRef,
  useState
} from "react";
import IWorkListAction from "../interfaces/IWorkListAction";
import IWorkListItem from "../interfaces/IWorkListItem";
import { WorkListActionType } from "../types/WorkListActionType";
import { useAppContext } from "./AppContext";
import Button from "./Button";
import Dialog from "./Dialog";
import ConfirmDialog from "./ConfirmDialog";
import { Deserialise, Serialise } from "../WorkListSerialiser";

const validTimeFormats = ["hh:mm:ss", "hh:mm"];

const IMPORT_CONFIRM_DIALOG = (
  <ConfirmDialog
    message="Importing will replace all current entries. Continue?"
    acceptText="Yes"
    cancelText="No"
    className="warning"
  />
);

const IMPORT_ERROR_DIALOG = (
  <ConfirmDialog
    message="Could not import entries from this file."
    acceptText="OK"
    className="error"
  />
);

interface IProps {
  workItems: IWorkListItem[];
  workItemDispatcher: Dispatch<IWorkListAction>;
}

export default function Settings({ workItems, workItemDispatcher }: IProps) {
  const appContext = useAppContext();
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const [intervalValue, setIntervalValue] = useState(appContext.settings.updateInterval / 1000);
  const [timeFormat, setTimeFormat] = useState(appContext.settings.timeFormat);

  const closeSettings = () => {
    appContext.setUpdateInterval(intervalValue * 1000);
    appContext.setTimeFormat(timeFormat);
    appContext.popView();
  };

  const changeInterval = (ev: ChangeEvent<HTMLInputElement>) => {
    setIntervalValue(parseInt(ev.target.value));
  };

  const inputKeyUp = (ev: KeyboardEvent<HTMLInputElement>) => {
    if (ev.code === "Enter" || ev.code === "NumpadEnter") {
      closeSettings();
      ev.preventDefault;
    }
  };

  const changeTimeFormat = (ev: ChangeEvent<HTMLSelectElement>) => {
    setTimeFormat(ev.target.value);
  };

  const clickOutsideComponent = () => {
    closeSettings();
  };

  const exportEntries = () => {
    const json = Serialise(workItems);
    const blob = new Blob([json], { type: "application/json" });
    const exportUrl = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);

    const link = document.createElement("a");
    link.href = exportUrl;
    link.download = `time-out-entries-${date}.json`;
    link.click();

    URL.revokeObjectURL(exportUrl);
  };

  const openImportPicker = () => {
    importFileInputRef.current?.click();
  };

  const importEntries = async (ev: ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    ev.target.value = "";

    if (!file) {
      return;
    }

    const shouldReplace = await appContext.pushView<boolean>(
      IMPORT_CONFIRM_DIALOG
    );
    if (!shouldReplace) {
      return;
    }

    try {
      const fileText = await file.text();
      const importedItems = Deserialise(fileText);

      workItemDispatcher({
        type: WorkListActionType.Replace,
        value: importedItems
      });
    } catch {
      await appContext.pushView<boolean>(IMPORT_ERROR_DIALOG);
    }
  };

  return (
    <Dialog className="settings-component" title="Settings" onClose={clickOutsideComponent}>
      <div className="row">
        <label htmlFor="update-interval" className="dialog-input-label">
          Update every
        </label>
        <input
          name="update-interval"
          className="dialog-input-control"
          type="number"
          value={intervalValue}
          onChange={changeInterval}
          onKeyUp={inputKeyUp}
          min={0}
          max={300}
        />
        <span>seconds</span>
      </div>
      <div className="row">
        <label htmlFor="time-format" className="dialog-input-label">
          Time format
        </label>
        <select
          className="dialog-input control time-format-picker"
          onChange={changeTimeFormat}
          defaultValue={timeFormat}
        >
          {validTimeFormats.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        {/* <input name="time-format" value={timeFormat} onChange={changeTimeFormat} onKeyUp={inputKeyUp} /> */}
      </div>
      <div className="row settings-import-export-row">
        <Button onClick={exportEntries}>Export Entries</Button>
        <Button onClick={openImportPicker}>Import Entries</Button>
        <input
          ref={importFileInputRef}
          type="file"
          accept="application/json,.json"
          className="settings-hidden-file-input"
          onChange={importEntries}
        />
      </div>
    </Dialog>
  );
}
