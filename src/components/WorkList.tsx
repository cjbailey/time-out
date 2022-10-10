import { Dispatch, SetStateAction, useState } from "react";
import IWorkListItem from "../interfaces/IWorkListItem";
import IWorkListItemAction from "../interfaces/IWorkListAction";
import { WorkListActionType } from "../types/WorkListActionType";
import Time from "../types/Time";
import TimerAction from "../types/TimerAction";
import WorkItem from "./WorkItem";

interface IProps {
  items: IWorkListItem[];
  workItemDispatcher: Dispatch<IWorkListItemAction>;
}

export default function WorkList({ items, workItemDispatcher }: IProps) {
  const [activeTimer, setActiveTimer] = useState<TimerAction | null>(null);

  const addItem = (title: string) => {
    const lastIdx = items.at(-1)?.id || 0;

    workItemDispatcher({
      type: WorkListActionType.Create,
      value: {
        id: lastIdx + 1,
        title: title,
        startTime: new Time(),
        lastStartTime: new Time(),
        elapsedTime: new Time()
      }
    });
  };

  const deleteItem = (id: number) => {
    workItemDispatcher({
      type: WorkListActionType.Delete,
      value: id
    });

    if (activeTimer && activeTimer.workListItem.id === id) {
      activeTimer.stop();
      setActiveTimer(null);
    }
  };

  const startItemTimer = (id: number) => {
    let idx = items.findIndex((x) => x.id === id);
    if (idx < 0) {
      return;
    }

    if (items[idx].startTime.timeInMilliseconds === 0) {
      items[idx].startTime = Time.now();
    }

    items[idx].lastStartTime = Time.now();

    if (activeTimer) {
      activeTimer.stop();
    }

    const timer = new TimerAction(
      items[idx],
      () => {
        workItemDispatcher({
          type: WorkListActionType.Update,
          value: items[idx]
        });
      },
      1000
    );

    timer.start();
    setActiveTimer(timer);
  };

  const resetAll = () => {
    // setItems([]);
    workItemDispatcher({
      type: WorkListActionType.Reset
    });

    if (activeTimer) {
      activeTimer.stop();
      setActiveTimer(null);
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
        disabled={activeTimer?.workListItem.id === x.id}
        onDeleteWorkItem={deleteItem}
        onStartItemTimer={startItemTimer}
      />
    ));
  };

  return (
    <div className="work-list">
      <div className="work-list-items">
        <div className="work-item header">
          <div></div>
          <div></div>
          <div>Start Time</div>
          <div>Last Start Time</div>
          <div>Elapsed</div>
        </div>
        {renderWorkItems()}
        {/* new item */}
        <WorkItem onCreateWorkItem={addItem} />
      </div>
      <div className="work-list-actions">
        <button onClick={resetAll}>Reset All</button>
      </div>
    </div>
  );
}