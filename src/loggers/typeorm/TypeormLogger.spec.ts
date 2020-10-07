import { Logger } from "@nestjs/common"
import { TypeormLogger } from "./TypeormLogger"

describe("TypeormLogger", () => {
  const logs: any[][] = []

  beforeEach(() => {
    const logger = new Logger()
    Logger.overrideLogger(logger)
    jest
      .spyOn(logger, "log")
      .mockImplementation((...args: any) => logs.push(args))
    jest
      .spyOn(logger, "warn")
      .mockImplementation((...args: any) => logs.push(args))
    jest
      .spyOn(logger, "debug")
      .mockImplementation((...args: any) => logs.push(args))
    jest
      .spyOn(logger, "verbose")
      .mockImplementation((...args: any) => logs.push(args))
  })

  afterEach(() => {
    logs.length = 0
    jest.resetAllMocks()
  })

  test("logQuery()", () => {
    new TypeormLogger().logQuery("SELECT 1", [1])

    expect(logs).toEqual([
      [
        { __type__: "query", query: "SELECT 1", parameters: [1] },
        "typeorm",
        false,
      ],
    ])
  })
  
  test("logQuery() no params", () => {
    new TypeormLogger().logQuery("SELECT 1")

    expect(logs).toEqual([
      [
        { __type__: "query", query: "SELECT 1", parameters: [] },
        "typeorm",
        false,
      ],
    ])
  })

  test("logQueryError()", () => {
    new TypeormLogger().logQueryError("Error", "SELECT 1", [1])

    expect(logs).toEqual([
      [
        {
          __type__: "query",
          query: "SELECT 1",
          parameters: [1],
          error: "Error",
        },
        "typeorm",
        false,
      ],
    ])
  })
  
  test("logQueryError() no params", () => {
    new TypeormLogger().logQueryError("Error", "SELECT 1")

    expect(logs).toEqual([
      [
        {
          __type__: "query",
          query: "SELECT 1",
          parameters: [],
          error: "Error",
        },
        "typeorm",
        false,
      ],
    ])
  })

  test("logQuerySlow()", () => {
    new TypeormLogger().logQuerySlow(200, "SELECT 1", [1])

    expect(logs).toEqual([
      [
        {
          __type__: "slow_query",
          query: "SELECT 1",
          parameters: [1],
          duration: 200,
        },
        "typeorm",
        false,
      ],
    ])
  })

  test("logQuerySlow() no params", () => {
    new TypeormLogger().logQuerySlow(200, "SELECT 1")

    expect(logs).toEqual([
      [
        {
          __type__: "slow_query",
          query: "SELECT 1",
          parameters: [],
          duration: 200,
        },
        "typeorm",
        false,
      ],
    ])
  })

  test("logSchemaBuild()", () => {
    new TypeormLogger().logSchemaBuild("SELECT 1")

    expect(logs).toEqual([["SELECT 1", "typeorm", false]])
  })

  test("logMigration()", () => {
    new TypeormLogger().logMigration("SELECT 1")

    expect(logs).toEqual([["SELECT 1", "typeorm", false]])
  })
  
  test("log()", () => {
    new TypeormLogger().log("log", "hello")
    new TypeormLogger().log("info", "hello")
    new TypeormLogger().log("warn", "hello")

    expect(logs).toEqual([
      ["hello", "typeorm", false],
      ["hello", "typeorm", false],
      ["hello", "typeorm", false],
    ])
  })
})
