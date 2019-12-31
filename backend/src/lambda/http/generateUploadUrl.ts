import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import { createLogger } from '../../utils/logger'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const indexTable = process.env.INDEX_NAME
const bucketName = process.env.IMAGES_S3_BUCKET
const urlExpiration = parseInt(process.env.SIGNED_URL_EXPIRATION)

const logger = createLogger('uploadimg')

const s3 = new AWS.S3({
  signatureVersion: 'v4'
})

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  logger.info(todoId);

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
    //logger.info("query.then")
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

  if(statusCode==200){
    logger.info("getting url")
    var url=getUploadUrl(todoId)
    var urlAtt=url.split('?')[0];
    logger.info("upload url:"+url)
    await docClient.update({TableName: todosTable,
      Key:{
        'todoId' : Items[0].todoId,
        'createdAt' : Items[0].createdAt
      },
      UpdateExpression: "set #attachmentUrl = :a",
      ExpressionAttributeNames: {
        "#attachmentUrl": "attachmentUrl"
      },
      ExpressionAttributeValues:{
        ":a":urlAtt,
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
    body: JSON.stringify({
      message,
      uploadUrl: url
    })
  }
}

function getUploadUrl(imageId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: imageId,
    Expires: urlExpiration
  })
}

/*import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
  return undefined
}*/
