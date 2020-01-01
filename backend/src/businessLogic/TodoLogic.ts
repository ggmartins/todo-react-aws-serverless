import 'source-map-support/register'
import { createLogger } from '../utils/logger'
import { TodoAccess } from '../dataLayer/TodoAccess'
import { FileAccess } from '../dataLayer/fileAccess'
import { Response } from '../models/Response'
import { TodoItem } from '../models/TodoItem'

const logger = createLogger('todoLogic')

const todoAccess = new TodoAccess(false)
const fileAccess = new FileAccess(false)

export const uploadTodoFile = async (todoId :string, userId :string,
    res :Response) : Promise<string> => {
    var item: TodoItem = await todoAccess.getTodoItem(todoId, userId, res)
    if(res.statusCode === 200){
        logger.info("getting url")
        var url=fileAccess.getUploadUrl(todoId)
        var urlAtt=url.split('?')[0];
        logger.info("upload url:"+url)
        await todoAccess.updTodoItemAttachmentUrl(item.todoId, item.userId, urlAtt, res)
    }
    return url //return signed url 
}

export const deleteTodoItem = async (todoId :string, userId :string,
    res :Response) : Promise<void> => {
    const item: TodoItem = await todoAccess.getTodoItem(todoId, userId, res)
    await todoAccess.delTodoItem(todoId, userId, res)
    
    if (res.statusCode == 200) {
        if (!item.attachmentUrl || 0 === item.attachmentUrl.length){
        logger.info("OK: removing file")
        if(item.attachmentUrl)
            await fileAccess.delObject(item.attachmentUrl,res)
        } else {
            logger.info("OK: no attachement to remove")
        }
    }
}