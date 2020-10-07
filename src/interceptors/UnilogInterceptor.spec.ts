import { TL_ACCUMULATOR, TL_LOGGER } from "#/constants"
import { from } from "rxjs"
import { UnilogInterceptor } from "./UnilogInterceptor"

describe("UnilogInterceptor", () => {
  const namespace = {
    createContext: jest.fn(),
    enter: jest.fn(),
    exit: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
  }
  const logger = {
    _createRequestLogger: jest.fn(),
    _createRequestAccumulator: jest.fn(),
    _flush: jest.fn(),
  }
  const execution = {
    switchToHttp: () => ({
      getRequest: jest.fn(),
      getResponse: jest.fn(),
    }),
    switchToRpc: () => ({
      getContext: jest.fn(),
    }),
  }
  const call = {
    handle: () => from([null]),
  }

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  test("sets request scope", async () => {
    const scope = { [Symbol.for("test")]: true }
    const interceptor = new UnilogInterceptor(namespace as any, logger as any)
    namespace.createContext.mockImplementation(() => scope)
    await interceptor.intercept(execution as any, call).toPromise()

    expect(namespace.createContext).toHaveBeenCalledTimes(1)
    expect(namespace.enter).toHaveBeenNthCalledWith(1, scope)
    expect(namespace.exit).toHaveBeenNthCalledWith(1, scope)
  })

  test("sets request logger and accumulator", async () => {
    const requestLogger = { [Symbol.for("test")]: true }
    const requestAccumulator = { [Symbol.for("test")]: true }
    logger._createRequestLogger.mockImplementation(() => requestLogger)
    logger._createRequestAccumulator.mockImplementation(() => requestAccumulator)
    const interceptor = new UnilogInterceptor(namespace as any, logger as any)

    await interceptor.intercept(execution as any, call).toPromise()

    expect(namespace.set).toHaveBeenCalledWith(TL_LOGGER, requestLogger)
    expect(namespace.set).toHaveBeenCalledWith(
      TL_ACCUMULATOR,
      requestAccumulator,
    )
  })

  test("flushes accumulated logs", async () => {
    const interceptor = new UnilogInterceptor(namespace as any, logger as any)

    await interceptor.intercept(execution as any, call).toPromise()

    expect(logger._flush).toBeCalledTimes(1)
  })

  test("collect request method and path for fastify", async () => {
    const http = {
      getRequest: () => ({ id: 1, method: "GET", url: "/" }),
      getResponse: () => ({ code: () => {}, statusCode: 0 }),
    } as any

    jest.spyOn(execution, "switchToHttp").mockImplementation(() => http)

    const interceptor = new UnilogInterceptor(namespace as any, logger as any)

    await interceptor.intercept(execution as any, call).toPromise()

    expect(logger._flush).toBeCalledWith({
      id: expect.any(String),
      fastifyId: 1,
      method: "GET",
      pathname: "/",
      statusCode: 0,
      transport: "http",
      duration: expect.any(Number),
    })
  })

  test("collect request method and path for express", async () => {
    const http = {
      getRequest: () => ({ method: "GET", path: "/" }),
      getResponse: () => ({ statusCode: 0 }),
    } as any

    jest.spyOn(execution, "switchToHttp").mockImplementation(() => http)

    const interceptor = new UnilogInterceptor(namespace as any, logger as any)

    await interceptor.intercept(execution as any, call).toPromise()

    expect(logger._flush).toBeCalledWith({
      id: expect.any(String),
      method: "GET",
      pathname: "/",
      statusCode: 0,
      transport: "http",
      duration: expect.any(Number),
    })
  })

  test("collect rpc context", async () => {
    const http = {
      getRequest: () => null,
      getResponse: () => null,
    } as any
    const context = [Symbol.for("RPC")]
    const rpc = {
      getContext: () => context
    } as any

    jest.spyOn(execution, "switchToHttp").mockImplementation(() => http)
    jest.spyOn(execution, "switchToRpc").mockImplementation(() => rpc)

    const interceptor = new UnilogInterceptor(namespace as any, logger as any)

    await interceptor.intercept(execution as any, call).toPromise()

    expect(logger._flush).toBeCalledWith({
      id: expect.any(String),
      command: context,
      transport: "rpc",
      duration: expect.any(Number),
    })
  })
})
