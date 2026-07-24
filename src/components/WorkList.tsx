import React, {
  ChangeEvent,
  Dispatch,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import IWorkListItemAction from "../interfaces/IWorkListAction";
import IWorkListItem from "../interfaces/IWorkListItem";
import Time from "../types/Time";
import TimerAction from "../types/TimerAction";
import { WorkListActionType } from "../types/WorkListActionType";
import { WorkListItemId } from "../types/WorkListItemId";
import { useAppContext } from "./AppContext";
import Button from "./Button";
import ConfirmDialog from "./ConfirmDialog";
import EditTimeDialog from "./EditTimeDialog";
import WorkItem from "./WorkItem";

interface IProps {
  items: IWorkListItem[];
  workItemDispatcher: Dispatch<IWorkListItemAction>;
}

interface IActiveTimer {
  id: WorkListItemId;
  timer: TimerAction;
}

const DEFAULT_FOLDER = "General";
const LS_FOLDERS = "my-work-list-folders";

const CONFIRM_RESET_ALL_DIALOG = (
  <ConfirmDialog
    message="Are you sure you want to delete all items?"
    acceptText="Yes"
    cancelText="No"
    className="warning"
  />
);

const CONFIRM_RESET_TIMES_DIALOG = (
  <ConfirmDialog
    message="Are you sure you want to reset all times?"
    acceptText="Yes"
    cancelText="No"
    className="warning"
  />
);

const CONFIRM_DELETE_DIALOG = (
  <ConfirmDialog
    message="Delete the item?"
    acceptText="Yes"
    cancelText="No"
    className="warning"
  />
);

const EDIT_TIME_OF_ACTIVE_TIMER_NOT_ALLOWED_DIALOG = (
  <ConfirmDialog
    message="Editing the time of an active timer is not allowed."
    acceptText="OK"
    className="error"
  />
);

export default function WorkList({ items, workItemDispatcher }: IProps) {
  const { settings } = useAppContext();
  const [activeTimer, setActiveTimer] = useState<IActiveTimer | null>(null);
  const [dragSource, setDragSource] = useState<WorkListItemId | null>(null);
  const [dragTarget, setDragTarget] = useState<WorkListItemId | null>(null);
  const [activeFolder, setActiveFolder] = useState<string>(DEFAULT_FOLDER);
  const [newFolder, setNewFolder] = useState<string>("");
  const itemsRef = useRef<IWorkListItem[]>(items);
  const [customFolders, setCustomFolders] = useState<string[]>(() => {
    const ls = localStorage.getItem(LS_FOLDERS);
    if (!ls) {
      return [];
    }

    try {
      const parsed = JSON.parse(ls);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map((x) => `${x}`.trim())
        .filter((x) => !!x && x !== DEFAULT_FOLDER);
    } catch {
      return [];
    }
  });

  const appContext = useAppContext();

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const folders = useMemo(() => {
    const uniq = Array.from(
      new Set([
        ...customFolders,
        ...items.map((x) => x.folder || DEFAULT_FOLDER)
      ])
    );

    if (!uniq.includes(DEFAULT_FOLDER)) {
      uniq.unshift(DEFAULT_FOLDER);
    }

    return uniq.sort((a, b) => a.localeCompare(b));
  }, [items, customFolders]);

  useEffect(() => {
    localStorage.setItem(LS_FOLDERS, JSON.stringify(customFolders));
  }, [customFolders]);

  const visibleItems = useMemo(() => {
    return items.filter(
      (item) => (item.folder || DEFAULT_FOLDER) === activeFolder
    );
  }, [items, activeFolder]);

  useEffect(() => {
    if (!folders.includes(activeFolder)) {
      setActiveFolder(DEFAULT_FOLDER);
    }
  }, [folders, activeFolder]);

  const addFolder = () => {
    const folderName = newFolder.trim();
    if (!folderName) {
      return;
    }

    const alreadyExists = folders.some(
      (folder) => folder.toLowerCase() === folderName.toLowerCase()
    );

    if (!alreadyExists && folderName !== DEFAULT_FOLDER) {
      setCustomFolders((prev) => [...prev, folderName]);
    }

    setActiveFolder(folderName);
    setNewFolder("");
  };

  const addItem = (title: string) => {
    const lastIdx = items.reduce<WorkListItemId>(
      (prev, curr) => (curr.id > prev ? curr.id : prev),
      0
    );

    workItemDispatcher({
      type: WorkListActionType.Create,
      value: {
        id: lastIdx + 1,
        folder: activeFolder,
        title: title,
        startTime: new Time(),
        lastStartTime: new Time(),
        elapsedTime: new Time()
      }
    });
  };

  const deleteItem = async (id: number) => {
    const confirm = await appContext.pushView<boolean>(CONFIRM_DELETE_DIALOG);
    if (!confirm) return;

    workItemDispatcher({
      type: WorkListActionType.Delete,
      value: id
    });

    if (activeTimer && activeTimer.id === id) {
      activeTimer.timer.stop();
      setActiveTimer(null);
    }
  };

  const updateItem = (
    id: WorkListItemId,
    folder: string,
    title: string,
    startTime: Time,
    lastStartTime: Time,
    elapsedTime: Time
  ) => {
    workItemDispatcher({
      type: WorkListActionType.Update,
      value: {
        id,
        folder,
        title,
        startTime,
        lastStartTime,
        elapsedTime
      }
    });
  };

  const moveItemToFolder = (id: WorkListItemId, folder: string) => {
    const item = items.find((x) => x.id === id);
    if (!item) {
      return;
    }

    updateItem(
      id,
      folder,
      item.title,
      item.startTime,
      item.lastStartTime,
      item.elapsedTime
    );
  };

  const startItemTimer = (item: IWorkListItem, resume = false) => {
    const itemToStart = { ...item };

    if (!resume) {
      if (itemToStart.startTime.timeInMilliseconds === 0) {
        itemToStart.startTime = Time.now();
      }

      itemToStart.lastStartTime = Time.now();

      workItemDispatcher({
        type: WorkListActionType.Update,
        value: itemToStart
      });
    }

    if (activeTimer) {
      activeTimer.timer.stop();
    }

    const timer = new TimerAction(
      itemToStart.elapsedTime,
      itemToStart.lastStartTime,
      (currentElapsedTime) => {
        const latestItem = itemsRef.current.find(
          (x) => x.id === itemToStart.id
        );
        if (!latestItem) {
          return;
        }

        workItemDispatcher({
          type: WorkListActionType.Update,
          value: { ...latestItem, elapsedTime: currentElapsedTime }
        });
      },
      appContext.settings.updateInterval
    );

    timer.start();
    setActiveTimer({ id: itemToStart.id, timer });
  };

  const resetAll = async () => {
    const confirm = await appContext.pushView<boolean>(
      CONFIRM_RESET_ALL_DIALOG
    );
    if (!confirm) {
      return;
    }

    workItemDispatcher({
      type: WorkListActionType.Reset
    });

    if (activeTimer) {
      activeTimer.timer.stop();
      setActiveTimer(null);
    }
  };

  const resetTimes = async () => {
    const confirm = await appContext.pushView<boolean>(
      CONFIRM_RESET_TIMES_DIALOG
    );
    if (!confirm) {
      return;
    }

    workItemDispatcher({
      type: WorkListActionType.ResetTimes
    });

    if (activeTimer) {
      activeTimer.timer.stop();
      setActiveTimer(null);
    }
  };

  const dragItemStart = (id: WorkListItemId) => {
    setDragSource(id);
  };

  const dragItemEnd = () => {
    if (dragSource !== dragTarget) {
      const sourceIdx = items.findIndex((x) => x.id === dragSource);
      const targetIdx = items.findIndex((x) => x.id === dragTarget);

      if (sourceIdx >= 0 && targetIdx >= 0) {
        const sourceItem = items[sourceIdx];
        const targetItem = items[targetIdx];

        items.splice(sourceIdx, 1);
        items.splice(targetIdx, 0, sourceItem);

        workItemDispatcher({
          type: WorkListActionType.Update,
          value: sourceItem
        });

        workItemDispatcher({
          type: WorkListActionType.Update,
          value: targetItem
        });
      }
    }

    setDragSource(null);
  };

  const dragItemEnter = (id: WorkListItemId) => {
    setDragTarget(id);
  };

  const editTime = async (id: WorkListItemId) => {
    const idx = items.findIndex((x) => x.id === id);
    if (idx < 0) {
      return;
    }

    const item = items[idx];
    const startTime = item.startTime;
    const lastStartTime = item.lastStartTime;
    const elapsedTime = item.elapsedTime;

    if (id === activeTimer?.id) {
      await appContext.pushView<boolean>(
        EDIT_TIME_OF_ACTIVE_TIMER_NOT_ALLOWED_DIALOG
      );
      return;
    }

    const view = (
      <EditTimeDialog startTime={startTime} elapsedTime={elapsedTime} />
    );
    const viewResult = await appContext.pushView<{
      startTime: Time;
      elapsedTime: Time;
    }>(view);

    if (viewResult) {
      // const diff = viewResult.startTime.sub(startTime);
      // if (diff.timeInMilliseconds < 0) {
      //   await appContext.pushView<boolean>(INVALID_TIME_DIALOG);
      //   return;
      // }

      updateItem(
        id,
        item.folder,
        item.title,
        viewResult.startTime,
        lastStartTime,
        viewResult.elapsedTime
      );
    }
  };

  const renderWorkItems = () => {
    return visibleItems.map((x) => (
      <WorkItem
        key={x.id}
        id={x.id}
        folder={x.folder}
        folders={folders}
        title={x.title}
        startTime={x.startTime}
        lastStartTime={x.lastStartTime}
        elapsedTime={x.elapsedTime}
        disabled={activeTimer?.id === x.id}
        onDeleteWorkItem={deleteItem}
        onStartItemTimer={(id) =>
          startItemTimer(items.filter((x) => x.id === id)[0])
        }
        onUpdateWorkItem={updateItem}
        onMoveWorkItem={moveItemToFolder}
        onDragStart={dragItemStart}
        onDragEnd={dragItemEnd}
        onDragEnter={dragItemEnter}
        onEditTime={editTime}
      />
    ));
  };

  const renderTotalElapsed = () => {
    const total = items.reduce(
      (prev, curr) => prev.add(curr.elapsedTime),
      Time.zero()
    );

    return (
      <div className="work-list-total">
        <span className="label">Total Elapsed</span>
        <span className="value">{total.toString(settings.timeFormat)}</span>
      </div>
    );
  };

  const onFolderNameChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setNewFolder(ev.currentTarget.value);
  };

  const onFolderNameKeyUp = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === "Enter") {
      addFolder();
    }
  };

  return (
    <div className="work-list">
      {renderTotalElapsed()}

      <div className="tabs-container">
        <div className="tabs-header">
          <div className="tabs-list">
            {folders.map((folder) => (
              <Button
                key={folder}
                className={`tab-btn ${folder === activeFolder ? "active" : ""}`}
                onClick={() => setActiveFolder(folder)}
              >
                {folder}
              </Button>
            ))}
          </div>
          <div className="tabs-create">
            <input
              value={newFolder}
              onChange={onFolderNameChange}
              onKeyUp={onFolderNameKeyUp}
              placeholder="New folder"
            />
            <Button onClick={addFolder}>Add Folder</Button>
          </div>
        </div>

        <div className="work-list-items">
          <div className="work-item header">
            <div className="handle"></div>
            <div className="delete"></div>
            <div className="title"></div>
            <div className="folder">Folder</div>
            <div className="start-time">
              <div>Start Time</div>
              <div className="time-format-label">{settings.timeFormat}</div>
            </div>
            <div className="last-start-time">
              <div>Last Start Time</div>
              <div className="time-format-label">{settings.timeFormat}</div>
            </div>
            <div className="elapsed-time">
              <div>Elapsed</div>
              <div className="time-format-label">{settings.timeFormat}</div>
            </div>
          </div>
          {renderWorkItems()}
          {/* new item */}
          <WorkItem onCreateWorkItem={addItem} />
        </div>
      </div>

      <div className="work-list-actions">
        <Button onClick={resetAll}>Delete All</Button>
        <Button onClick={resetTimes}>Reset Times</Button>
      </div>
    </div>
  );
}
