<p align="center">
  <img alt="NestJS Unilog" src="https://raw.githubusercontent.com/znckco/nestjs-unilog/master/.assets/cover.png"/>
</p>

<h1 align="center">NestJS Unilog</h1>

<p align="center">

[![NPM](https://img.shields.io/npm/v/nestjs-unilog)](https://www.npmjs.com/package/nestjs-unilog)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v2.0%20adopted-ff69b4.svg)](CODE_OF_CONDUCT.md)
[![CI](https://github.com/znckco/nestjs-unilog/workflows/CI/badge.svg)](https://github.com/znckco/nestjs-unilog/actions?query=workflow%3ACI)
[![codecov](https://codecov.io/gh/znckco/nestjs-unilog/branch/master/graph/badge.svg)](https://codecov.io/gh/znckco/nestjs-unilog)

</p>

## Description

Unilog is request context logger for NestJS.

## Installation

```bash
$ npm install --save nestjs-unilog
```

## Quick Start

```ts
import { UnilogModule, RequestContextLogger } from "nestjs-unilog"
import { Module } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"

// 1. Register  UnilogModule
@Module({ imports: [UnilogModule] })
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  // 2. Use RequestContextLogger
  app.useLogger(app.get(RequestContextLogger))

  await app.listen(3000)
}

bootstrap()
```

## Stay in touch

- Author - [Rahul Kadyan](https://znck.me)
- Twitter - [@znck0](https://twitter.com/znck0)

## License

NestJS Unilog is [MIT licensed](LICENSE).
