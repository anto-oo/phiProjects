import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import express from 'express'
import * as z from 'zod/v4'
import {
  PlannerServiceError,
  createNode,
  deleteNode,
  getProjectTree,
  listProjects,
  moveNode,
  searchNodes,
  updateNode,
} from '../../server/src/services/plannerService.js'

const app = createMcpExpressApp({ host: '0.0.0.0' })
const port = Number(process.env.PORT) || 3002

function structuredResult(data) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data),
      },
    ],
    structuredContent: data,
  }
}

function handleToolError(error) {
  if (error instanceof PlannerServiceError) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            ok: false,
            error: {
              code: error.code,
              message: error.message,
              status: error.status,
            },
          }),
        },
      ],
      structuredContent: {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          status: error.status,
        },
      },
      isError: true,
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          ok: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
            status: 500,
          },
        }),
      },
    ],
    structuredContent: {
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        status: 500,
      },
    },
    isError: true,
  }
}

function getServer() {
  const server = new McpServer(
    {
      name: 'planner-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: { tools: {} },
    },
  )

  server.registerTool(
    'list_projects',
    {
      description: 'List all planner projects',
      outputSchema: {
        ok: z.boolean(),
        projects: z.array(z.record(z.string(), z.unknown())),
      },
    },
    async () => {
      try {
        const projects = await listProjects()
        return structuredResult({ ok: true, projects })
      } catch (error) {
        return handleToolError(error)
      }
    },
  )

  server.registerTool(
    'get_project_tree',
    {
      description: 'Get full node tree for one project',
      inputSchema: {
        projectId: z.string().min(1),
      },
      outputSchema: {
        ok: z.boolean(),
        project: z.record(z.string(), z.unknown()),
        tree: z.array(z.record(z.string(), z.unknown())),
      },
    },
    async ({ projectId }) => {
      try {
        const data = await getProjectTree(projectId)
        return structuredResult({ ok: true, ...data })
      } catch (error) {
        return handleToolError(error)
      }
    },
  )

  server.registerTool(
    'create_node',
    {
      description: 'Create one planner node (epic|feature|task)',
      inputSchema: {
        projectId: z.string().min(1),
        title: z.string().min(1),
        type: z.enum(['epic', 'feature', 'task']),
        parentId: z.string().optional(),
        description: z.string().optional(),
        priority: z.string().optional(),
        status: z.string().optional(),
      },
      outputSchema: {
        ok: z.boolean(),
        node: z.record(z.string(), z.unknown()),
      },
    },
    async ({ projectId, title, type, parentId, description, priority, status }) => {
      try {
        const node = await createNode({
          projectId,
          title,
          type,
          parentId,
          description,
          priority,
          status,
        })
        return structuredResult({ ok: true, node })
      } catch (error) {
        return handleToolError(error)
      }
    },
  )

  server.registerTool(
    'update_node',
    {
      description: 'Update node fields (title, description, status, priority, dates, parent, order)',
      inputSchema: {
        nodeId: z.string().min(1),
        fields: z
          .object({
            title: z.string().optional(),
            description: z.string().nullable().optional(),
            status: z.string().optional(),
            priority: z.string().optional(),
            startDate: z.string().datetime().nullable().optional(),
            endDate: z.string().datetime().nullable().optional(),
            parentId: z.string().nullable().optional(),
            order: z.number().int().optional(),
            type: z.enum(['epic', 'feature', 'task']).optional(),
          })
          .strict(),
      },
      outputSchema: {
        ok: z.boolean(),
        node: z.record(z.string(), z.unknown()),
      },
    },
    async ({ nodeId, fields }) => {
      try {
        const node = await updateNode(nodeId, fields)
        return structuredResult({ ok: true, node })
      } catch (error) {
        return handleToolError(error)
      }
    },
  )

  server.registerTool(
    'move_node',
    {
      description: 'Move one node to new parent/order',
      inputSchema: {
        nodeId: z.string().min(1),
        newParentId: z.string().nullable(),
        newOrder: z.number().int(),
      },
      outputSchema: {
        ok: z.boolean(),
        node: z.record(z.string(), z.unknown()),
      },
    },
    async ({ nodeId, newParentId, newOrder }) => {
      try {
        const node = await moveNode(nodeId, newParentId, newOrder)
        return structuredResult({ ok: true, node })
      } catch (error) {
        return handleToolError(error)
      }
    },
  )

  server.registerTool(
    'delete_node',
    {
      description: 'Delete one node and all descendants (cascade)',
      inputSchema: {
        nodeId: z.string().min(1),
      },
      outputSchema: {
        ok: z.boolean(),
        deletedNodeIds: z.array(z.string()),
      },
    },
    async ({ nodeId }) => {
      try {
        const result = await deleteNode(nodeId)
        return structuredResult({ ok: true, ...result })
      } catch (error) {
        return handleToolError(error)
      }
    },
  )

  server.registerTool(
    'search_nodes',
    {
      description: 'Search nodes by text, status and priority filters',
      inputSchema: {
        projectId: z.string().min(1),
        query: z.string().optional(),
        filters: z
          .object({
            status: z.union([z.string(), z.array(z.string())]).optional(),
            priority: z.union([z.string(), z.array(z.string())]).optional(),
          })
          .optional(),
      },
      outputSchema: {
        ok: z.boolean(),
        nodes: z.array(z.record(z.string(), z.unknown())),
      },
    },
    async ({ projectId, query, filters }) => {
      try {
        const nodes = await searchNodes(projectId, query, filters)
        return structuredResult({ ok: true, nodes })
      } catch (error) {
        return handleToolError(error)
      }
    },
  )

  return server
}

app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.post('/mcp', async (req, res) => {
  const server = getServer()
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    })

    await server.connect(transport)
    await transport.handleRequest(req, res, req.body)
    res.on('close', async () => {
      await transport.close()
      await server.close()
    })
  } catch (error) {
    console.error('Error handling MCP request:', error)
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      })
    }
  }
})

app.all('/mcp', (req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: 'Method not allowed.',
    },
    id: null,
  })
})

app.listen(port, () => {
  console.log(`MCP server listening on port ${port}`)
})
