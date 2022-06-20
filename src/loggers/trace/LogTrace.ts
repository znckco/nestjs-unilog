import { LogItem } from "../generic/LogItem"

export interface LogTrace extends LogItem<"trace"> {
  method: string
  description?: string
  args?: any[]
  duration: number
}
