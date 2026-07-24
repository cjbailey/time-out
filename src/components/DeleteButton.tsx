import React, { MouseEventHandler } from "react";
import DeleteIcon from "../icons/delete-icon.svg?react";
import Button from "./Button";

interface IProps {
  onClick?: MouseEventHandler;
}

export default function DeleteButton({ onClick }: IProps): React.JSX.Element {
  return (
    <Button className="delete-btn img-btn" onClick={onClick}>
      <DeleteIcon width="0.8em" />
    </Button>
  );
}
