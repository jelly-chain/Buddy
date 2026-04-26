// deploy — module runner
import { dispatch } from "../../core/run.mjs";
import * as tools from "./tools/index.mjs";
dispatch(tools, "deploy");
