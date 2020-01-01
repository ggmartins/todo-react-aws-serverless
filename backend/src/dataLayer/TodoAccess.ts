import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('todoAccess')

import { TodoItem } from '../models/TodoItem'
import { Response } from '../models/Response'

const todosTable = process.env.TODOS_TABLE
const indexTable = process.env.INDEX_NAME

export class TodoAccess {
    constructor(
        private enableAWSX:boolean,  
        private readonly docClient: DocumentClient = new AWS.DynamoDB.DocumentClient(),
        private readonly TodoTable: string = todosTable,
        private readonly IndexTable: string = indexTable,      
    ){
        if(this.enableAWSX)
          this.docClient = new XAWS.DynamoDB.DocumentClient()
    }

    async newTodoItem(userId: string, name:string, dueDate:string, response: Response): Promise<TodoItem> {
        response.statusCode = 200
        response.message = 'OK'

        const item: TodoItem = {
            todoId: uuid.v4(),
            name: name,
            userId: userId,
            createdAt: new Date().toISOString(),
            dueDate: dueDate,
            done: false,
            //attachmentUrl: ''
          }
          await this.docClient.put({
              TableName: this.TodoTable,
              Item: item
          }).promise().then( item => {
              logger.info("newTodoItem:"+item)
          }).catch( err => {
            logger.error("newTodoItem:"+err)
            response.statusCode = 500
            response.message = err
          })
          return item
    }

    async qryTodoItem(userId: string, response: Response): Promise<TodoItem[]> {
        response.statusCode = 200
        response.message = 'OK'
        var items: TodoItem[] = []
        logger.info('querying db')
        await this.docClient.query({
          TableName: this.TodoTable,
          IndexName: this.IndexTable,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': userId
          }
        })
        .promise().then( result => {
            if(result.Items.length > 0)
              items.push.apply(result.Items)
            //TODO: no mem copy
            //https://stackoverflow.com/questions/22875636/how-do-i-cast-a-json-object-to-a-typescript-class
            var item:TodoItem
            result.Items.forEach(i=>{
                item = {
                    todoId: i.todoId,
                    name: i.name,
                    userId: i.userId,
                    createdAt: i.createdAt,
                    dueDate: i.dueDate,
                    done: i.done,
                    attachmentUrl: i.attachmentUrl
                }
                items.push(item)
            })
            logger.info("items:"+JSON.stringify(items))
            logger.info("result.items:"+JSON.stringify(result.Items))
        }).catch( err => {
          response.statusCode = 500
          response.message = err
          logger.error("qryTodoItem:"+err)
        })
        return items
    }

    async delTodoItem(todoId: string, userId: string, response: Response) {
        response.statusCode = 200
        response.message = 'OK'
       
        logger.info('delTodoItem')
        await this.docClient.delete({
            TableName: this.TodoTable,
            Key :{
                'todoId': todoId,
                'userId': userId
            }
        }).promise().then( result => {
            logger.info("OK:"+result)
        }).catch( err => {
            response.statusCode = 500
            response.message = err
            logger.error("delTodoItem:"+err)
        })
    }

    async getTodoItem(todoId: string, userId: string, response: Response): Promise<TodoItem> {
        response.statusCode = 200
        response.message = 'OK'
       
        logger.info('getTodoItem')
        var item: TodoItem
        await this.docClient
        /*.query({
          TableName: this.TodoTable,
          IndexName: this.IndexTable,
          KeyConditionExpression: 'todoId = :todoId and userId = :userId',
          ExpressionAttributeValues: {
            ':todoId': todoId,
            ':userId': userId
          }
        })
        .promise().then( result => {*/
            .get({
                TableName: this.TodoTable,
                Key :{
                    'todoId': todoId,
                    'userId': userId
                }
            }).promise().then( result => {
          
          
          if (result.Item.length === 0){
            response.statusCode = 404
            response.message = "Not found"
          } else {
             //logger.info('OK:'+result.Items[0].todoId)
             //TODO: fix this, terrible memcpy here
             logger.info("OK")
             if(typeof result.Item.attachmentUrl === 'undefined')
                result.Item.attachmentUrl=''
             item = {
                 todoId: result.Item.todoId,
                 name: result.Item.name,
                 userId: result.Item.userId,
                 createdAt: result.Item.createdAt,
                 dueDate: result.Item.dueDate,
                 done: result.Item.done,
                 attachmentUrl: result.Item.attachmentUrl
             }        
             /*if(typeof result.Items[0].attachmentUrl === 'undefined')
               result.Items[0].attachmentUrl=''
             item = {
               todoId: result.Items[0].todoId,
               name: result.Items[0].name,
               userId: result.Items[0].userId,
               createdAt: result.Items[0].createdAt,
               dueDate: result.Items[0].dueDate,
               done: result.Items[0].done,
               attachmentUrl: result.Items[0].attachmentUrl
             }*/
             //if(result.Items[0].attachmentUrl)
             //  item.attachmentUrl=result.Items[0].attachmentUrl
             //if (result.Item.length > 1) {
             //   response.message = "WARNING: db returns more than one result"
             //}
          }
        }).catch( err => {
          response.statusCode = 500
          response.message = err
          logger.error("getTodoItem:"+err)
        })
        return item
    }

    async updTodoItemStatus(
        todoId: string, userId: string, dueDate: string, 
        done:boolean, 
        response: Response
    ): Promise<TodoItem> {
        response.statusCode = 200
        response.message = 'OK'
        logger.info('updating db')
        var item: TodoItem
        await this.docClient.update({TableName: todosTable,
            Key:{
              'todoId' : todoId,
              'userId' : userId
            },
            UpdateExpression: "set dueDate=:t, done=:d",
            ExpressionAttributeValues:{
              ":t":dueDate,
              ":d":done
            },
            ReturnValues:"UPDATED_NEW"
          }).promise().then( result => {
            logger.info("OK")
            if(typeof result.Attributes.attachmentUrl === 'undefined')
               result.Attributes.attachmentUrl=''
            item = {
                todoId: result.Attributes.todoId,
                name: result.Attributes.name,
                userId: result.Attributes.userId,
                createdAt: result.Attributes.createdAt,
                dueDate: result.Attributes.dueDate,
                done: result.Attributes.done,
                attachmentUrl: result.Attributes.attachmentUrl
            }        
          }).catch( err => {
            logger.error("updTodoItem:" + err)
            response.statusCode = 500
            response.message = err
        })
        return item
    }

    async updTodoItemAttachmentUrl(
        todoId: string, userId: string, urlAtt: string,
        response: Response
    ): Promise<TodoItem> {
        response.statusCode = 200
        response.message = 'OK'
        logger.info('updating db')
        var item: TodoItem
        await this.docClient.update({TableName: todosTable,
            Key:{
                'todoId' : todoId,
                'userId' : userId
            },
            UpdateExpression: "set #attachmentUrl = :a",
            ExpressionAttributeNames: {
                "#attachmentUrl": "attachmentUrl"
            },
            ExpressionAttributeValues:{
                ":a":urlAtt,
            },
            ReturnValues:"UPDATED_NEW"
          }).promise().then( result => {
            logger.info("OK")
            if(typeof result.Attributes.attachmentUrl === 'undefined')
               result.Attributes.attachmentUrl=''
            item = {
                todoId: result.Attributes.todoId,
                name: result.Attributes.name,
                userId: result.Attributes.userId,
                createdAt: result.Attributes.createdAt,
                dueDate: result.Attributes.dueDate,
                done: result.Attributes.done,
                attachmentUrl: result.Attributes.attachmentUrl
            }        
          }).catch( err => {
            logger.error("updTodoItem:" + err)
            response.statusCode = 500
            response.message = err
        })
        return item
    }

}