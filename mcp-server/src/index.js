import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createCapacityServer } from "./server.js";

const server = createCapacityServer();
const transport = new StdioServerTransport();
await server.connect(transport);
