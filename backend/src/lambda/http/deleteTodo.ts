import 'source-map-support/register'
//import { parseUserId } from '../../auth/utils'
import * as AWS  from 'aws-sdk'
import { createLogger } from '../../utils/logger'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'


const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const indexTable = process.env.INDEX_NAME
const bucketName = process.env.IMAGES_S3_BUCKET
const logger = createLogger('deltodos')

const s3 = new AWS.S3({
  signatureVersion: 'v4'
})

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  if(event.httpMethod==='OPTIONS'){
    return {
      statusCode:200,
      headers: {
        //TODO: remove this for production and make it optional in serverless.yml
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': '*'
      },
      body:null
    }
  }

  //const authorization = event.headers.Authorization
  //const split = authorization.split(' ')
  //const jwtToken = split[1]

  //const userId=parseUserId(jwtToken)

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
    /*result.Items.forEach(element => {
      logger.info("element:"+element)
      logger.info("element.todoId:"+ element.todoId)
      logger.info("element.createdAt:"+ element.createdAt)
    });*/
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
    await docClient.delete({
      TableName: todosTable,
      Key:{
        'todoId' : Items[0].todoId,
        'createdAt' : Items[0].createdAt
      }
    })
    .promise().then(function(){
      logger.info("OK")
    }).catch(err=>{
      logger.error("error removing item: "+ err)
      statusCode = 500
      message = err
    })

    if(Items[0].attachmentUrl){
      await s3.deleteObject({  
          Bucket: bucketName, 
          Key: Items[0].attachmentUrl
      }).promise().catch(err=>{
        message = message + "|" +err
      })
    }
  }
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body:message
  }
}
