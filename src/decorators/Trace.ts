import { Logger } from "@nestjs/common"
import { performance } from "perf_hooks"
import { isObservable } from "rxjs"
import { tap } from "rxjs/operators"

export function Trace(options?: { args: boolean }): MethodDecorator {
  return (target, methodName, descriptor) => {
    if (typeof descriptor.value === "function") {
      const method = `${target.constructor.name}.${methodName.toString()}`
      const shouldIncludeArgs = options?.args === true
      const logger = new Logger("trace")
      const end = (startedAt: number, params: any[]): void => {
        const duration = performance.now() - startedAt
        const args = shouldIncludeArgs ? params : undefined
        logger.log({ __type__: "trace", method, args, duration })
      }
      const fn = descriptor.value

      descriptor.value = new Proxy(descriptor.value, {
        apply: (target, thisArg, args) => {
          const startedAt = performance.now()
          const result = target.apply(thisArg, args)

          if (result instanceof Promise) {
            return result.finally(() => end(startedAt, args))
          } else if (isObservable(result)) {
            return result.pipe(tap({ complete: () => end(startedAt, args) }))
          } else {
            end(startedAt, args)
            return result
          }
        },
      })

      Reflect.getMetadataKeys(fn).forEach((metadataKey) => {
        Reflect.defineMetadata(
          metadataKey,
          Reflect.getMetadata(metadataKey, fn),
          descriptor.value!,
        )
      })

      return descriptor
    }
  }
}
