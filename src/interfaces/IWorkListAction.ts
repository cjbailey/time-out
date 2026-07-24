import IWorkListItem from "./IWorkListItem";
import {WorkListActionType} from "../types/WorkListActionType";
import {WorkListItemId} from "../types/WorkListItemId";

export default interface IWorkListAction {
    type: WorkListActionType;
    value?: IWorkListItem | WorkListItemId | IWorkListItem[];
}
