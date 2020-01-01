import 'source-map-support/register'
//import * as AWS  from 'aws-sdk'
import { createLogger } from '../../utils/logger'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { Response } from '../../models/Response'
import { TodoAccess } from '../../dataLayer/TodoAccess'
import { getUserIdFromAuthorization } from '../../auth/utils'

//const docClient = new AWS.DynamoDB.DocumentClient()
//const todosTable = process.env.TODOS_TABLE
//const indexTable = process.env.INDEX_NAME

const todoAccess = new TodoAccess(false)

const logger = createLogger('updtodos')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const userId = getUserIdFromAuthorization(event.headers.Authorization)
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  logger.info(todoId);
  logger.info(updatedTodo);

  var res: Response = { statusCode: 501, message: 'Not Implemented'};

  await todoAccess.updTodoItemStatus(todoId, userId,
      updatedTodo.dueDate,
      updatedTodo.done,
      res)

  return {
    statusCode: res.statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: res.message
  }
}