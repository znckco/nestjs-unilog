import { LogItem } from "../generic/LogItem"

export interface LogQuery extends LogItem<"query"> {
  query: string
  parameters: string[]
  error?: string
}
