import React from "react";
import Time from "../types/Time";
import { useAppContext } from "./AppContext";
import Button from "./Button";
import Dialog from "./Dialog";

export interface IAllocationReportEntry {
  id: number;
  folder: string;
  title: string;
  elapsedTime: Time;
  elapsedDecimalHours: number;
  allocationRatio: number;
}

interface IProps {
  entries: IAllocationReportEntry[];
  totalAllocated: Time;
  timeFormat: string;
}

export default function AllocationReportDialog({
  entries,
  totalAllocated,
  timeFormat
}: IProps) {
  const appContext = useAppContext();

  const closeDialog = () => {
    appContext.popView();
  };

  return (
    <Dialog
      className="allocation-report-dialog"
      title="Time Allocation Report"
      onClose={closeDialog}
    >
      <div className="allocation-report-summary">
        <span className="summary-label">Total Allocated</span>
        <span className="summary-value">{totalAllocated.toString(timeFormat)}</span>
      </div>

      <div className="allocation-report-table-wrap">
        <table className="allocation-report-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Folder</th>
              <th>Title</th>
              <th>Elapsed</th>
              <th>Elapsed (hours)</th>
              <th>Allocation</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.id}</td>
                <td>{entry.folder}</td>
                <td>{entry.title}</td>
                <td>{entry.elapsedTime.toString(timeFormat)}</td>
                <td>{entry.elapsedDecimalHours.toFixed(2)}</td>
                <td>{entry.allocationRatio.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="allocation-report-actions">
        <Button onClick={closeDialog}>Close</Button>
      </div>
    </Dialog>
  );
}
