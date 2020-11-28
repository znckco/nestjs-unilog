/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/promise-function-async */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Logger, SetMetadata } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { from } from "rxjs"
import { Trace } from "./Trace"

describe("@Trace()", () => {
  class Example {
    @Trace()
    get foo() {
      return "foo"
    }

    @SetMetadata("after", 1)
    @Trace()
    @SetMetadata("before", 1)
    simple() {
      return 1
    }

    @Trace()
    promise() {
      return new Promise((resolve) => setTimeout(resolve, 1))
    }

    @Trace()
    observable() {
      return from([1])
    }

    @Trace()
    deep() {
      this.simple()

      return this.promise()
    }

    @Trace({ args: true })
    withArgs(...args: any) {}
  }

  afterEach(() => {
    Logger.overrideLogger(console)
  })

  test("should preserve method annotations", () => {
    const instance = new Example()
    const reflector = new Reflector()

    expect(reflector.get("after", Example.prototype.simple)).toBe(1)
    expect(reflector.get("after", Object.getPrototypeOf(instance).simple)).toBe(
      1,
    )

    expect(reflector.get("before", Example.prototype.simple)).toBe(1)
    expect(
      reflector.get("before", Object.getPrototypeOf(instance).simple),
    ).toBe(1)
  })

  test("trace sync method", () => {
    const logs: any[][] = []
    const logger = new Logger()
    Logger.overrideLogger(logger)
    jest.spyOn(logger, "log").mockImplementation((...args) => logs.push(args))

    const instance = new Example()

    instance.simple()

    expect(logs).toHaveLength(1)
    expect(logs).toEqual([
      [
        {
          __type__: "trace",
          args: undefined,
          duration: expect.any(Number),
          method: "Example.simple",
        },
        "trace",
        false,
      ],
    ])
  })

  test("trace async method", async () => {
    const logs: any[][] = []
    const logger = new Logger()
    Logger.overrideLogger(logger)
    jest.spyOn(logger, "log").mockImplementation((...args) => logs.push(args))

    const instance = new Example()

    await instance.promise()

    expect(logs).toHaveLength(1)
    expect(logs).toEqual([
      [
        {
          __type__: "trace",
          args: undefined,
          duration: expect.any(Number),
          method: "Example.promise",
        },
        "trace",
        false,
      ],
    ])
  })

  test("trace observable method", async () => {
    const logs: any[][] = []
    const logger = new Logger()
    Logger.overrideLogger(logger)
    jest.spyOn(logger, "log").mockImplementation((...args) => logs.push(args))

    const instance = new Example()

    await instance.observable().toPromise()

    expect(logs).toHaveLength(1)
    expect(logs).toEqual([
      [
        {
          __type__: "trace",
          args: undefined,
          duration: expect.any(Number),
          method: "Example.observable",
        },
        "trace",
        false,
      ],
    ])
  })

  test("trace with args", async () => {
    const logs: any[][] = []
    const logger = new Logger()
    Logger.overrideLogger(logger)
    jest.spyOn(logger, "log").mockImplementation((...args) => logs.push(args))

    const instance = new Example()

    instance.withArgs("foo", 1, "bar")

    expect(logs).toHaveLength(1)
    expect(logs).toEqual([
      [
        {
          __type__: "trace",
          args: ["foo", 1, "bar"],
          duration: expect.any(Number),
          method: "Example.withArgs",
        },
        "trace",
        false,
      ],
    ])
  })

  test("trace getters", async () => {
    const logs: any[][] = []
    const logger = new Logger()
    Logger.overrideLogger(logger)
    jest.spyOn(logger, "log").mockImplementation((...args) => logs.push(args))

    const instance = new Example()

    instance.foo

    expect(logs).toHaveLength(0)
  })

  test("trace recursively", async () => {
    const logs: any[][] = []
    const logger = new Logger()
    Logger.overrideLogger(logger)
    jest.spyOn(logger, "log").mockImplementation((...args) => logs.push(args))

    const instance = new Example()

    await instance.deep()

    expect(logs).toHaveLength(3)
    expect(logs).toEqual([
      [
        {
          __type__: "trace",
          args: undefined,
          duration: expect.any(Number),
          method: "Example.simple",
        },
        "trace",
        false,
      ],
      [
        {
          __type__: "trace",
          args: undefined,
          duration: expect.any(Number),
          method: "Example.promise",
        },
        "trace",
        false,
      ],
      [
        {
          __type__: "trace",
          args: undefined,
          duration: expect.any(Number),
          method: "Example.deep",
        },
        "trace",
        false,
      ],
    ])
  })
})
