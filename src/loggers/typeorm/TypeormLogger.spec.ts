import { Logger } from "@nestjs/common"
import { TypeormLogger } from "./TypeormLogger"

describe("TypeormLogger", () => {
  const logs: any[][] = []
  const logger = {
    log: (...args: any) => logs.push(args),
    warn: (...args: any) => logs.push(args),
    debug: (...args: any) => logs.push(args),
    verbose: (...args: any) => logs.push(args),
  } as unknown as Logger

  beforeEach(() => {
    logs.length = 0
    Logger.overrideLogger(logger)
  })

  test("logQuery()", () => {
    new TypeormLogger().logQuery("SELECT 1;", [1])

    expect(logs).toEqual([
      [{ __type__: "query", query: "SELECT 1;", parameters: [1] }, "typeorm"],
    ])
  })

  test("logQuery() no params", () => {
    new TypeormLogger().logQuery("SELECT 1;")

    expect(logs).toEqual([
      [{ __type__: "query", query: "SELECT 1;", parameters: [] }, "typeorm"],
    ])
  })

  test("logQueryError()", () => {
    new TypeormLogger().logQueryError("Error", "SELECT 1;", [1])

    expect(logs).toEqual([
      [
        {
          __type__: "query",
          query: "SELECT 1;",
          parameters: [1],
          error: "Error",
        },
        "typeorm",
      ],
    ])
  })

  test("logQueryError() no params", () => {
    new TypeormLogger().logQueryError("Error", "SELECT 1;")

    expect(logs).toEqual([
      [
        {
          __type__: "query",
          query: "SELECT 1;",
          parameters: [],
          error: "Error",
        },
        "typeorm",
      ],
    ])
  })

  test("logQuerySlow()", () => {
    new TypeormLogger().logQuerySlow(200, "SELECT 1;", [1])

    expect(logs).toEqual([
      [
        {
          __type__: "slow_query",
          query: "SELECT 1;",
          parameters: [1],
          duration: 200,
        },
        "typeorm",
      ],
    ])
  })

  test("logQuerySlow() no params", () => {
    new TypeormLogger().logQuerySlow(200, "SELECT 1;")

    expect(logs).toEqual([
      [
        {
          __type__: "slow_query",
          query: "SELECT 1;",
          parameters: [],
          duration: 200,
        },
        "typeorm",
      ],
    ])
  })

  test("logSchemaBuild()", () => {
    new TypeormLogger().logSchemaBuild("SELECT 1;")

    expect(logs).toEqual([["SELECT 1;", "typeorm"]])
  })

  test("logMigration()", () => {
    new TypeormLogger().logMigration("SELECT 1;")

    expect(logs).toEqual([["SELECT 1;", "typeorm"]])
  })

  test("log()", () => {
    new TypeormLogger().log("log", "hello")
    new TypeormLogger().log("info", "hello")
    new TypeormLogger().log("warn", "hello")

    expect(logs).toEqual([
      ["hello", "typeorm"],
      ["hello", "typeorm"],
      ["hello", "typeorm"],
    ])
  })
})
