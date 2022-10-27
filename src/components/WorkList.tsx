import React, { Dispatch, useState } from "react";
import IWorkListItemAction from "../interfaces/IWorkListAction";
import IWorkListItem from "../interfaces/IWorkListItem";
import Time from "../types/Time";
import TimerAction from "../types/TimerAction";
import { WorkListActionType } from "../types/WorkListActionType";
import { WorkListItemId } from "../types/WorkListItemId";
import { useAppContext } from "./AppContext";
import Button from "./Button";
import ConfirmDialog from "./ConfirmDialog";
import EditStartTimeDialog from "./EditStartTimeDialog";
import WorkItem from "./WorkItem";

interface IProps {
  items: IWorkListItem[];
  workItemDispatcher: Dispatch<IWorkListItemAction>;
}

interface IActiveTimer {
  id: WorkListItemId;
  timer: TimerAction;
}

const CONFIRM_RESET_ALL_DIALOG = (
  <ConfirmDialog message="Are you sure you want to delete all items?" acceptText="Yes" cancelText="No" />
);

const CONFIRM_RESET_TIMES_DIALOG = (
  <ConfirmDialog message="Are you sure you want to reset all times?" acceptText="Yes" cancelText="No" />
);

const CONFIRM_DELETE_DIALOG = <ConfirmDialog message="Delete the item?" acceptText="Yes" cancelText="No" />;

export default function WorkList({ items, workItemDispatcher }: IProps) {
  const [activeTimer, setActiveTimer] = useState<IActiveTimer | null>(null);
  const [dragSource, setDragSource] = useState<WorkListItemId | null>(null);
  const [dragTarget, setDragTarget] = useState<WorkListItemId | null>(null);

  const appContext = useAppContext();

  const addItem = (title: string) => {
    const lastIdx = items.reduce<WorkListItemId>((prev, curr) => (curr.id > prev ? curr.id : prev), 0);

    workItemDispatcher({
      type: WorkListActionType.Create,
      value: {
        id: lastIdx + 1,
        title: title,
        startTime: new Time(),
        lastStartTime: new Time(),
        elapsedTime: new Time(),
      },
    });
  };

  const deleteItem = async (id: number) => {
    const confirm = await appContext.pushView<boolean>(CONFIRM_DELETE_DIALOG);
    if (!confirm) return;

    workItemDispatcher({
      type: WorkListActionType.Delete,
      value: id,
    });

    if (activeTimer && activeTimer.id === id) {
      activeTimer.timer.stop();
      setActiveTimer(null);
    }
  };

  const updateItem = (id: WorkListItemId, title: string, startTime: Time, lastStartTime: Time, elapsedTime: Time) => {
    workItemDispatcher({
      type: WorkListActionType.Update,
      value: {
        id,
        title,
        startTime,
        lastStartTime,
        elapsedTime,
      },
    });
  };

  const startItemTimer = (item: IWorkListItem, resume = false) => {
    if (!resume) {
      if (item.startTime.timeInMilliseconds === 0) {
        item.startTime = Time.now();
      }

      item.lastStartTime = Time.now();
    }

    if (activeTimer) {
      activeTimer.timer.stop();
    }

    const timer = new TimerAction(
      item.elapsedTime,
      item.lastStartTime,
      (currentElapsedTime) => {
        workItemDispatcher({
          type: WorkListActionType.Update,
          value: { ...item, elapsedTime: currentElapsedTime },
        });
      },
      appContext.settings.updateInterval
    );

    timer.start();
    setActiveTimer({ id: item.id, timer });
  };

  const resetAll = async () => {
    const confirm = await appContext.pushView<boolean>(CONFIRM_RESET_ALL_DIALOG);
    if (!confirm) {
      return;
    }

    workItemDispatcher({
      type: WorkListActionType.Reset,
    });

    if (activeTimer) {
      activeTimer.timer.stop();
      setActiveTimer(null);
    }
  };

  const resetTimes = async () => {
    const confirm = await appContext.pushView<boolean>(CONFIRM_RESET_TIMES_DIALOG);
    if (!confirm) {
      return;
    }

    workItemDispatcher({
      type: WorkListActionType.ResetTimes,
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
          value: sourceItem,
        });

        workItemDispatcher({
          type: WorkListActionType.Update,
          value: targetItem,
        });
      }
    }

    setDragSource(null);
  };

  const dragItemEnter = (id: WorkListItemId) => {
    setDragTarget(id);
  };

  const editStartTime = async (id: WorkListItemId) => {
    const idx = items.findIndex((x) => x.id === id);
    if (idx < 0) {
      return;
    }

    const item = items[idx];
    const startTime = item.startTime;
    const lastStartTime = item.lastStartTime;
    const elapsedTime = item.elapsedTime;

    const view = <EditStartTimeDialog startTime={startTime} />;

    if (activeTimer && activeTimer.id === id) {
      // Suspend the timer callback until the update is complete
      activeTimer.timer.stop();
    }

    const newStartTime = await appContext.pushView<Time>(view);
    if (newStartTime) {
      const diff = newStartTime.sub(startTime);
      const newElapsedTime = diff;

      updateItem(id, item.title, newStartTime, lastStartTime, newElapsedTime);

      if (activeTimer && activeTimer.id === id) {
        const timer = new TimerAction(
          newElapsedTime,
          lastStartTime,
          (currentElapsedTime) => {
            workItemDispatcher({
              type: WorkListActionType.Update,
              value: { ...item, elapsedTime: currentElapsedTime },
            });
          },
          appContext.settings.updateInterval
        );

        timer.start();
        setActiveTimer({ id, timer });
      }
    }
  };

  const renderWorkItems = () => {
    return items.map((x) => (
      <WorkItem
        key={x.id}
        id={x.id}
        title={x.title}
        startTime={x.startTime}
        lastStartTime={x.lastStartTime}
        elapsedTime={x.elapsedTime}
        disabled={activeTimer?.id === x.id}
        onDeleteWorkItem={deleteItem}
        onStartItemTimer={(id) => startItemTimer(items.filter((x) => x.id === id)[0])}
        onUpdateWorkItem={updateItem}
        onDragStart={dragItemStart}
        onDragEnd={dragItemEnd}
        onDragEnter={dragItemEnter}
        onEditStartTime={editStartTime}
      />
    ));
  };

  return (
    <div className="work-list">
      <div className="work-list-items">
        <div className="work-item header">
          <div className="handle"></div>
          <div className="delete"></div>
          <div className="title"></div>
          <div className="start-time">Start Time</div>
          <div className="last-start-time">Last Start Time</div>
          <div className="elapsed-time">Elapsed</div>
        </div>
        {renderWorkItems()}
        {/* new item */}
        <WorkItem onCreateWorkItem={addItem} />
      </div>
      <div className="work-list-actions">
        <Button onClick={resetAll}>Delete All</Button>
        <Button onClick={resetTimes}>Reset Times</Button>
      </div>
    </div>
  );
}
