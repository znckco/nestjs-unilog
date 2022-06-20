import { DestinationStream, LoggerOptions } from "pino"

export interface UnilogOptions {
  pino: LoggerOptions
  pinoDest?: DestinationStream
  groupLogsByRequest?: boolean
  reportServerTiming?: boolean
}
