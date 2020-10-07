import { Controller, Get, Logger, Module, Type } from "@nestjs/common"
import { UnilogModule, RequestContextLogger } from "./index"
import request from "supertest"
import { Test } from "@nestjs/testing"

@Controller()
class ExampleController {
  private logger = new Logger(ExampleController.name)

  @Get("/test")
  test() {
    this.logger.warn("this is a test")
  }
}

@Module({
  imports: [UnilogModule],
})
class ExampleApp {}

@Module({
  imports: [UnilogModule.forRoot({})],
})
class ExampleApp2 {}

describe("Unilog", () => {
  async function createApp(appModule: Type<any>) {
    const moduleRef = await Test.createTestingModule({
      imports: [appModule],
      controllers: [ExampleController],
    }).compile()
    const app = moduleRef.createNestApplication(undefined, { logger: true })

    await app.init()

    return app
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test("use module", async () => {
    const write = jest
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true)

    const app = await createApp(ExampleApp)
    app.useLogger(app.get(RequestContextLogger))

    await request(app.getHttpServer()).get("/test").expect(200)
    await app.close()

    expect(write).toHaveBeenCalledWith(expect.stringMatching(/this is a test/))
  })

  test("use module forRoot", async () => {
    const write = jest
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true)

    const app = await createApp(ExampleApp2)
    app.useLogger(app.get(RequestContextLogger))

    await request(app.getHttpServer()).get("/test").expect(200)
    await app.close()

    expect(write).toHaveBeenCalledWith(expect.stringMatching(/this is a test/))
  })
})
