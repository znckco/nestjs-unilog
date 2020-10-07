import { LogItem } from "./LogItem"

export interface LogMessage
  extends LogItem<"error" | "warn" | "log" | "debug" | "verbose"> {
  message: any
  context?: string
  trace?: string
  diff: number
}
