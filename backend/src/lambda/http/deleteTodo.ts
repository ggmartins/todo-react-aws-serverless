import 'source-map-support/register'
//import { createLogger } from '../../utils/logger'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { Response } from '../../models/Response'
import { getUserIdFromAuthorization } from '../../auth/utils'
import { deleteTodoItem } from '../../businessLogic/TodoLogic'

//const logger = createLogger('deleteTodo')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if(event.httpMethod==='OPTIONS'){ //TODO: Fix API Gateway with proper configuration
    return {
      statusCode : 200,
      headers: {
        //TODO: remove this for production and make it optional in serverless.yml
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': '*'
      },
      body : null
    }
  }

  const userId = getUserIdFromAuthorization(event.headers.Authorization)
  const todoId = event.pathParameters.todoId

  var res: Response = { statusCode: 501, message: 'Not Implemented' };

  await deleteTodoItem(todoId, userId, res)

  return {
    statusCode : res.statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body : res.message
  }
}
