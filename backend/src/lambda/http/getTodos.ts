import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { createLogger } from '../../utils/logger'
import { Response } from '../../models/Response'
import { TodoItem } from '../../models/TodoItem'
import { TodoAccess } from '../../dataLayer/TodoAccess'
import { getUserIdFromAuthorization } from '../../auth/utils'

const todoAccess = new TodoAccess(false)

const logger = createLogger('gettodos')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const userId=getUserIdFromAuthorization(event.headers.Authorization)
  logger.info("running gettodos")
  var items: TodoItem[]
  var res: Response = { statusCode: 501, message: 'Not Implemented'};

  items = await todoAccess.qryTodoItem(userId, res)

  return {
    statusCode: res.statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      items : items,
      message: res.message
    })
  }

}
