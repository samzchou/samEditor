import * as X6 from "@antv/x6";
import "@antv/x6-vue-shape";

import { basicNode, pathNode } from "./models";

export default () => {
	basicNode(X6);
    pathNode(X6);
}
