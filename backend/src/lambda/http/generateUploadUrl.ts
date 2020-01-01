import 'source-map-support/register'
//import { createLogger } from '../../utils/logger'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { Response } from '../../models/Response'
import { getUserIdFromAuthorization } from '../../auth/utils'
import { uploadTodoFile } from '../../businessLogic/TodoLogic'

//const logger = createLogger('uploadimg')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const userId = getUserIdFromAuthorization(event.headers.Authorization)
  //logger.info(todoId);

  var res: Response = { statusCode: 501, message: 'Not Implemented' };

  const url:string = await uploadTodoFile(todoId, userId, res)
  
  return {
    statusCode: res.statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      message: res.message,
      uploadUrl: url
    })
  }
}
