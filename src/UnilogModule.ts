/* eslint-disable @typescript-eslint/no-extraneous-class */
import { DynamicModule, Module, ModuleMetadata } from "@nestjs/common"
import { APP_INTERCEPTOR } from "@nestjs/core"
import { createNamespace } from "cls-hooked"
import { NAMESPACE_PROVIDER, OPTIONS, OPTIONS_PROVIDER } from "./constants"
import { UnilogInterceptor } from "./interceptors/UnilogInterceptor"
import { UnilogOptions } from "./interfaces/UnilogOptions"
import { RequestContextLogger } from "./services/RequestContextLogger"

@Module({})
class InternalModule {}

function getModuleOptions(options: UnilogOptions): ModuleMetadata {
  return {
    providers: [
      { provide: APP_INTERCEPTOR, useClass: UnilogInterceptor },
      { provide: NAMESPACE_PROVIDER, useValue: createNamespace("Unilog") },
      { provide: OPTIONS_PROVIDER, useValue: options },
      RequestContextLogger,
      UnilogInterceptor,
    ],
    exports: [RequestContextLogger],
  }
}

@Module(getModuleOptions(OPTIONS))
export class UnilogModule {
  static forRoot(options: Partial<UnilogOptions>): DynamicModule {
    const config = { ...OPTIONS, ...options }

    return {
      ...getModuleOptions(config),
      module: InternalModule,
    }
  }
}
