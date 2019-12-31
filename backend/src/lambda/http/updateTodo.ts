import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import { createLogger } from '../../utils/logger'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const indexTable = process.env.INDEX_NAME

const logger = createLogger('updtodos')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  logger.info(todoId);
  logger.info(updatedTodo);

  var statusCode = 200
  var message = 'OK'

  var Items=[]
  await docClient
  .query({
    TableName: todosTable,
    IndexName: indexTable,
    KeyConditionExpression: 'todoId = :todoId',
    ExpressionAttributeValues: {
      ':todoId': todoId
    }
  })
  .promise().then(function(result){
    Items = result.Items
    if (Items.length == 0){
      statusCode = 404
      message = "Not found"
    }
  }).catch(err=>{
    logger.error(err)
    message = err
    statusCode = 500
  })

  if (statusCode == 200) {
    
    //if (!Items[0].attachmentUrl) Items[0].attachmentUrl=''
    logger.info("updating "+JSON.stringify(Items))
    await docClient.update({TableName: todosTable,
      Key:{
        'todoId' : Items[0].todoId,
        'createdAt' : Items[0].createdAt
      },
      UpdateExpression: "set dueDate=:t, done=:d",
      ExpressionAttributeValues:{
        ":t":updatedTodo.dueDate,
        ":d":updatedTodo.done
      },
      ReturnValues:"UPDATED_NEW"
    }).promise().then(function(){
      logger.info("OK")
    }).catch(err=>{
      logger.error("error updating item: "+ err)
      statusCode = 500
      message = err
    })
  }
  // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body:message
  }
}