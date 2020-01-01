import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { Response } from '../../models/Response'
import { TodoItem } from '../../models/TodoItem'
import { TodoAccess } from '../../dataLayer/TodoAccess'
import { getUserIdFromAuthorization } from '../../auth/utils'
import { createLogger } from '../../utils/logger'

const todoAccess = new TodoAccess(false)

const logger = createLogger('createtodos')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodo: CreateTodoRequest = JSON.parse(event.body)
  const userId = getUserIdFromAuthorization(event.headers.Authorization)

  logger.info('createTodo')

  var res: Response = { statusCode: 501, message: 'Not Implemented'};

  const item: TodoItem = await todoAccess.newTodoItem(userId, newTodo.name, newTodo.dueDate, res)

  return {
    statusCode: res.statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      item
    })
  }
}
