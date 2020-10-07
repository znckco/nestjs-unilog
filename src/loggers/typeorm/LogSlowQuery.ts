import { LogItem } from "../generic/LogItem"

export interface LogSlowQuery extends LogItem<"slow_query"> {
  query: string
  parameters: any[]
  duration: number
}
