import typescript from "@rollup/plugin-typescript"
import dts from "rollup-plugin-dts"
import { dependencies } from "./package.json"

const external = ["rxjs/operators", ...Array.from(Object.keys(dependencies))]

export default [
  {
    input: "src/index.ts",
    output: { format: "cjs", file: "dist/unilog.js", sourcemap: true },
    plugins: [typescript()],
    external,
  },
  {
    input: "src/index.ts",
    output: { format: "esm", file: "dist/unilog.esm.js", sourcemap: true },
    plugins: [typescript()],
    external,
  },
  {
    input: "src/index.ts",
    output: { format: "esm", file: "dist/unilog.d.ts", sourcemap: true },
    plugins: [dts()],
  },
]
