import { Logger as NestLogger } from "@nestjs/common"
import { Logger } from "typeorm"
import { LogQuery } from "./LogQuery"
import { LogSlowQuery } from "./LogSlowQuery"

export class TypeormLogger implements Logger {
  private readonly logger = new NestLogger("typeorm")

  logQuery(query: string, parameters: any[] = []): void {
    this.writeQuery({ __type__: "query", query, parameters })
  }

  logQueryError(error: string, query: string, parameters: any[] = []): void {
    this.writeQuery({ __type__: "query", query, parameters, error })
  }

  logQuerySlow(duration: number, query: string, parameters: any[] = []): void {
    this.writeQuery({ __type__: "slow_query", query, parameters, duration })
  }

  logSchemaBuild(message: string): void {
    this.logger.debug(message)
  }

  logMigration(message: string): void {
    this.logger.verbose(message)
  }

  log(level: "log" | "info" | "warn", message: any): void {
    if (level === "warn") {
      this.logger.warn(message)
    } else {
      this.logger.log(message)
    }
  }

  private writeQuery(item: LogSlowQuery | LogQuery): void {
    this.logger.log(item)
  }
}
