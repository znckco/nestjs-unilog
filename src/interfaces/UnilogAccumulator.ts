import { LogMessage } from "../loggers/generic/LogMessage"
import { LogTrace } from "../loggers/trace/LogTrace"
import { LogQuery } from "../loggers/typeorm/LogQuery"
import { LogSlowQuery } from "../loggers/typeorm/LogSlowQuery"

export interface UnilogAccumulator {
  startedAt: number
  messages: LogMessage[]
  trace: LogTrace[]
  typeorm: {
    query: LogQuery[]
    slowQuery: LogSlowQuery[]
  }
}
