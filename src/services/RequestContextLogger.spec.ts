import { TL_ACCUMULATOR, TL_LOGGER } from "#/constants"
import { LogTrace } from "#/loggers/trace/LogTrace"
import { LogQuery } from "#/loggers/typeorm/LogQuery"
import { LogSlowQuery } from "#/loggers/typeorm/LogSlowQuery"
import { RequestContextLogger } from "./RequestContextLogger"

describe("RequestContextLogger", () => {
  const logs: string[] = []
  const namespace = {
    get: () => null,
  } as any
  let service: RequestContextLogger

  beforeEach(() => {
    service = new RequestContextLogger(namespace, {
      pino: {
        level: "trace",
      },
      pinoDest: {
        write: (message: string) => {
          logs.push(message)
        },
      },
    })
  })

  afterEach(() => {
    logs.length = 0
    jest.resetAllMocks()
  })

  test("LoggerService", () => {
    service.verbose("verbose")
    service.debug("debug")
    service.log("log")
    service.warn("warn")
    service.error("error")
    service.verbose({ kind: "verbose" })
    service.debug({ kind: "debug" })
    service.log({ kind: "log" })
    service.warn({ kind: "warn" })
    service.error({ kind: "error" })
    service.verbose("verbose", "context")
    service.debug("debug", "context")
    service.log("log", "context")
    service.warn("warn", "context")
    service.error("error", "context")

    expect(logs).toHaveLength(15)

    expect(logs).toEqual([
      expect.stringContaining("verbose"),
      expect.stringContaining("debug"),
      expect.stringContaining("log"),
      expect.stringContaining("warn"),
      expect.stringContaining("error"),
      expect.stringContaining('{"kind":"verbose"}'),
      expect.stringContaining('{"kind":"debug"}'),
      expect.stringContaining('{"kind":"log"}'),
      expect.stringContaining('{"kind":"warn"}'),
      expect.stringContaining('{"kind":"error"}'),
      expect.stringMatching(/context/),
      expect.stringMatching(/context/),
      expect.stringMatching(/context/),
      expect.stringMatching(/context/),
      expect.stringMatching(/context/),
    ])
  })

  test("accumulation", () => {
    const accumulator = service._createRequestAccumulator({ id: 1 })
    jest
      .spyOn(namespace, "get")
      .mockImplementation((key) =>
        key === TL_ACCUMULATOR ? accumulator : null,
      )

    service.extendBindings({ custom: "value" })
    service.verbose("verbose")
    service.debug("debug")
    service.log("log")
    service.warn("warn")
    service.error("error")
    service.verbose({ kind: "verbose" })
    service.debug({ kind: "debug" })
    service.log({ kind: "log" })
    service.warn({ kind: "warn" })
    service.error({ kind: "error" })
    service.verbose("verbose", "context")
    service.debug("debug", "context")
    service.log("log", "context")
    service.warn("warn", "context")
    service.error("error", "context")

    service.log(<LogQuery>{
      __type__: "query",
      query: "SELECT 1",
      parameters: [],
    })
    service.log(<LogSlowQuery>{
      __type__: "slow_query",
      query: "SELECT 1",
      parameters: [],
      duration: 10,
    })
    service.log(<LogTrace>{
      __type__: "trace",
      method: "Foo.bar",
      duration: 20,
    })

    service.log({ __type__: "custom" })

    expect(accumulator.messages).toHaveLength(16)
    expect(accumulator.trace).toHaveLength(1)
    expect(accumulator.typeorm.query).toHaveLength(1)
    expect(accumulator.typeorm.slowQuery).toHaveLength(1)
    expect(accumulator).toHaveProperty("custom", "value")

    service._flush(accumulator)

    expect(logs).toHaveLength(1)
  })

  test("extend bindings without accumulation", () => {
    expect(() => service.extendBindings({ custom: "value" })).not.toThrow()
  })

  test("child logger", () => {
    const logger = service._createRequestLogger({ id: 1 })
    jest
      .spyOn(namespace, "get")
      .mockImplementation((key) => (key === TL_LOGGER ? logger : null))
    const spy = jest.spyOn(logger, "info")
    service.log("Test")
    expect(spy).toHaveBeenCalledTimes(1)
    expect(logs).toHaveLength(1)
  })

  test("change level", () => {
    service.log("default trace level")
    expect(logs).toHaveLength(1)

    service.setLogLevel("warn")
    service.log("after changing to warn")
    expect(logs).toHaveLength(1)
    service.warn("but warn goes through")
    expect(logs).toHaveLength(2)

    service.setLogLevel("trace")
    service.log("after changing back to warn")
    expect(logs).toHaveLength(3)

    service.setLogLevel("silent")
    service.error("nothing goes through")
    expect(logs).toHaveLength(3)
  })
})
