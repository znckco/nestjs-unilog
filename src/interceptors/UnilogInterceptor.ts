import {
  NAMESPACE_PROVIDER,
  OPTIONS_PROVIDER,
  TL_ACCUMULATOR,
  TL_LOGGER,
} from "../constants"
import { RequestContextLogger } from "../services/RequestContextLogger"
import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from "@nestjs/common"
import type { Namespace } from "cls-hooked"
import type { Request, Response } from "express"
import type { FastifyReply, FastifyRequest } from "fastify"
import hyper from "hyperid"
import { performance } from "perf_hooks"
import type { Observable } from "rxjs"
import { tap } from "rxjs/operators"
import { UnilogOptions } from "../interfaces/UnilogOptions"

@Injectable()
export class UnilogInterceptor implements NestInterceptor {
  private readonly nextId = hyper()

  constructor(
    @Inject(NAMESPACE_PROVIDER)
    private readonly namespace: Namespace,

    @Inject(OPTIONS_PROVIDER)
    private readonly options: UnilogOptions,

    private readonly logger: RequestContextLogger,
  ) {}

  intercept(
    execution: ExecutionContext,
    call: CallHandler,
  ): Observable<unknown> {
    const context = this.namespace.createContext()
    const startedAt = performance.now()

    this.namespace.enter(context)

    const bindings = this.getEnterBindings(execution)
    const requestLogger = this.logger._createRequestLogger(bindings)
    const accumulator = this.logger._createRequestAccumulator(bindings)

    this.namespace.set(TL_LOGGER, requestLogger)
    this.namespace.set(TL_ACCUMULATOR, accumulator)

    return call.handle().pipe(
      tap({
        error: (exception) => {
          const duration = performance.now() - startedAt
          this.namespace.exit(context)
          this.logger._flush(
            {
              ...bindings,
              ...accumulator,
              ...this.getExitBindings(execution),
              duration,
              exception: {
                message: exception.message,
                stack: exception.stack,
              },
            },
            "error",
          )
        },
        complete: () => {
          const duration = performance.now() - startedAt
          this.namespace.exit(context)
          this.logger._flush({
            ...bindings,
            ...accumulator,
            ...this.getExitBindings(execution),
            duration,
          })

          if (
            this.options.reportServerTiming === true &&
            execution.getType() === "http"
          ) {
            const response = execution.switchToHttp().getResponse<any>()

            const value = [
              ...accumulator.trace
                .slice()
                .reverse()
                .map(
                  (item) => `${item.method};dur=${item.duration.toFixed(0)}`,
                ),
              `request;desc="${bindings.id}";dur=${duration}`,
            ].join(", ")

            if (response.headersSent === false) {
              // express
              response.setHeader("Server-Timing", value)
            } else if (response.sent === false) {
              // fastify
              response.header("Server-Timing", value)
            }
          }
        },
      }),
    )
  }

  private getEnterBindings(execution: ExecutionContext): Record<string, any> {
    const bindings: Record<string, any> = { id: this.nextId() }
    if (execution.switchToHttp().getRequest() != null) {
      Object.assign(
        bindings,
        this.getBindingsFromRequest(execution.switchToHttp().getRequest()),
      )
    } else if (execution.switchToRpc().getContext() != null) {
      const rpc = execution.switchToRpc()
      Object.assign(bindings, { command: rpc.getContext(), transport: "rpc" })
    }

    return bindings
  }

  private getExitBindings(execution: ExecutionContext): object {
    const bindings: Record<string, any> = {}
    if (execution.switchToHttp().getResponse() != null) {
      Object.assign(
        bindings,
        this.getBindingsFromResponse(execution.switchToHttp().getResponse()),
      )
    }

    return bindings
  }

  private getBindingsFromRequest(request: FastifyRequest | Request): object {
    if ("id" in request) {
      return {
        fastifyId: request.id,
        method: request.method,
        pathname: request.url,
        transport: "http",
      }
    } else {
      return {
        method: request.method,
        pathname: request.path,
        transport: "http",
      }
    }
  }

  private getBindingsFromResponse(request: FastifyReply | Response): object {
    if ("code" in request) {
      return { statusCode: request.statusCode }
    } else {
      return { statusCode: request.statusCode }
    }
  }
}
