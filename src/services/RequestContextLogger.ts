import {
  Inject,
  Injectable,
  LoggerService,
  OnApplicationShutdown,
} from "@nestjs/common"
import type { Namespace } from "cls-hooked"
import { createHash } from "crypto"
import pino from "pino"
import {
  NAMESPACE_PROVIDER,
  OPTIONS_PROVIDER,
  TL_ACCUMULATOR,
  TL_LOGGER,
} from "../constants"
import { UnilogAccumulator } from "../interfaces/UnilogAccumulator"
import { UnilogOptions } from "../interfaces/UnilogOptions"
import { LogItem } from "../loggers/generic/LogItem"
import { LogMessage } from "../loggers/generic/LogMessage"
import { LogTrace } from "../loggers/trace/LogTrace"
import { LogQuery } from "../loggers/typeorm/LogQuery"
import { LogSlowQuery } from "../loggers/typeorm/LogSlowQuery"

@Injectable()
export class RequestContextLogger
  implements LoggerService, OnApplicationShutdown
{
  private readonly pino: ReturnType<typeof pino>

  constructor(
    @Inject(NAMESPACE_PROVIDER)
    private readonly namespace: Namespace,

    @Inject(OPTIONS_PROVIDER)
    private readonly options: UnilogOptions,
  ) {
    this.pino =
      this.options.pinoDest != null
        ? pino(this.options.pino, this.options.pinoDest)
        : pino(this.options.pino)
  }

  /**
   * @private
   */
  onApplicationShutdown(): void {
    this.pino.flush()
  }

  private get logger(): pino.Logger {
    return this.namespace.get(TL_LOGGER) ?? this.pino
  }

  private get accumulator(): UnilogAccumulator | null {
    return this.namespace.get(TL_ACCUMULATOR)
  }

  /**
   * @private
   */
  _createRequestLogger(bindings: object): pino.Logger {
    return this.pino.child(bindings)
  }

  /**
   * @private
   */
  _createRequestAccumulator(bindings: Record<string, any>): UnilogAccumulator {
    return {
      ...bindings,
      startedAt: Date.now(),
      messages: [],
      trace: [],
      typeorm: { query: [], slowQuery: [] },
    }
  }

  setLogLevel(level: pino.LevelWithSilent): void {
    this.pino.level = level
  }

  extendBindings(bindings: object): void {
    const accumulator = this.accumulator

    if (accumulator != null) {
      Object.assign(accumulator, bindings)
    }
  }

  /**
   * @private
   */
  _flush(message: any, kind: "error" | "info" = "info"): void {
    if (kind === "info") {
      this.pino.info(message)
    } else {
      this.pino.error(message)
    }
  }

  error(message: any, trace?: string, context?: string): void {
    this.write("error", message, { context, trace })
  }

  warn(message: any, context?: string): void {
    this.write("warn", message, { context })
  }

  log(message: any, context?: string): void {
    this.write("log", message, { context })
  }

  debug(message: any, context?: string): void {
    this.write("debug", message, { context })
  }

  verbose(message: any, context?: string): void {
    this.write("verbose", message, { context })
  }

  private write(
    level: "error" | "warn" | "log" | "debug" | "verbose",
    message: unknown,
    options: { context?: string; trace?: string },
  ): void {
    const accumulator = this.accumulator

    if (accumulator != null) {
      if (this.options.groupLogsByRequest === false) {
        if (this.isLogItem(message)) {
          if (message.__type__ === "trace") {
            accumulator.trace.push(message as LogTrace)
          } else if (message.__type__ === "show_query") {
            const query = message as LogSlowQuery

            query.queryId = createHash("sha256")
              .update(query.query)
              .digest("hex")
              .slice(0, 8)

            accumulator.trace.push({
              __type__: "trace",
              method: "db",
              description: `query=${query.queryId}`,
              duration: query.duration,
            })
          }
        }

        const { typeorm, trace, messages, startedAt, ...bindings } = accumulator
        this._writeLog(level, options, message, bindings)
      } else {
        if (this.isLogItem(message)) {
          switch (message.__type__) {
            case "query":
              accumulator.typeorm.query.push(message as LogQuery)
              break
            case "slow_query":
              accumulator.typeorm.slowQuery.push(message as LogSlowQuery)
              break
            case "trace":
              accumulator.trace.push(message as LogTrace)
              break

            default:
              accumulator.messages.push(message as LogMessage)
              break
          }
        } else {
          accumulator.messages.push({
            __type__: level,
            message,
            ...options,
            diff: Date.now() - accumulator.startedAt,
          })
        }
      }
    } else {
      this._writeLog(level, options, message)
    }
  }

  private _writeLog(
    level: string,
    options: { context?: string | undefined; trace?: string | undefined },
    message: unknown,
    bindings?: Record<string, any>,
  ) {
    const logger = this.logger
    const fn =
      logger[
        level === "verbose" ? "trace" : level === "log" ? "info" : level
      ].bind(logger)
    fn({ ...options, ...bindings, message })
  }

  private isLogItem(message: unknown): message is LogItem<string> {
    return (
      typeof message === "object" && message !== null && "__type__" in message
    )
  }
}
