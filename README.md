# todo-react-aws-serverless
TODO Application with React and Serverless Framework for AWS

--------------

CRITERIA: The application allows users to create, update, delete TODO items
MEETS SPECIFICATIONS: A user of the web application can use the interface to create, delete and complete a TODO item.
IMPLEMENTED: OK

CRITERIA: The application allows users to upload a file.
MEETS SPECIFICATIONS: A user of the web interface can click on a "pencil" button, then select and upload a file. A file should appear in the list of TODO items on the home page.
IMPLEMENTED: OK

CRITERIA: The application only displays TODO items for a logged in user.
MEETS SPECIFICATIONS: If you log out from a current user and log in as a different user, the application should not show TODO items created by the first account.
IMPLEMENTED: OK, used auth0 with **cached** JSON WEB Token Key Set.

CRITERIA: Authentication is implemented and does not allow unauthenticated access.
MEETS SPECIFICATIONS: A user needs to authenticate in order to use an application.
IMPLEMENTED: OK, dinamodb query is used to filter userId

--------------

CRITERIA: The code is split into multiple layers separating business logic from I/O related code.
MEETS SPECIFICATIONS: Code of Lambda functions is split into multiple files/classes. The business logic of an application is separated from code for database access, file storage, and code related to AWS Lambda.
IMPLEMENTED: OK, not really much to do, data access is already in one function, only a couple of function in businessLogic
https://github.com/ggmartins/todo-react-aws-serverless/tree/master/backend/src/businessLogic
https://github.com/ggmartins/todo-react-aws-serverless/tree/master/backend/src/dataLayer

CRITERIA: Code is implemented using async/await and Promises without using callbacks. 
MEETS SPECIFICATIONS: To get results of asynchronous operations, a student is using async/await constructs instead of passing callbacks.
IMPLEMENTED: OK

--------------

CRITERIA: All resources in the application are defined in the "serverless.yml" file 
MEETS SPECIFICATIONS: All resources needed by an application are defined in the "serverless.yml". A developer does not need to create them manually using AWS console.
IMPLEMENTED: OK

CRITERIA: Each function has its own set of permissions.
MEETS SPECIFICATIONS: Instead of defining all permissions under provider/iamRoleStatements, permissions are defined per function in the functions section of the "serverless.yml".
IMPLEMENTED: OK

CRITERIA: Application has sufficient monitoring. 
MEETS SPECIFICATIONS: Application has at least some of the following: Distributed tracing is enabled / It has a sufficient amount of log statements / It generates application level metrics
IMPLEMENTED: OK, used winston logger everywhere

CRITERIA: HTTP requests are validated 
MEETS SPECIFICATIONS: Incoming HTTP requests are validated either in Lambda handlers or using request validation in API Gateway. The latter can be done either using the serverless-reqvalidator-plugin or by providing request schemas in function definitions.
IMPLEMENTED: OK

CRITERIA: Data is stored in a table with a composite key. 
MEETS SPECIFICATIONS: 1:M (1 to many) relationship between users and TODO items is modeled using a DynamoDB table that has a composite key with both partition and sort keys. Should be defined similar to this:
IMPLEMENTED: OK, I tried multiple combinations there and the one in the HEAD has the best performance and cheaper

CRITERIA: Scan operation is not used to read data from a database.
MEETS SPECIFICATIONS: TODO items are fetched using the "query()" method and not "scan()" method (which is less efficient on large datasets)
IMPLEMENTED: OK, there's NO scan in the code eventho you might find some perms in serverelss.yml

Fetch a certificate from Auth0 instead of hard coding it in an authorizer. OK
Implement pagination support to work around a DynamoDB limitation that allows up to 1MB of data using a query method. WIP
Add your own domain name to the service. WIP
Add an ability to sort TODOs by due date or priority (this will require adding new indexes). WIP
Implement a new endpoint that allows sending full-text search requests to Elasticsearch (this would require copying data from DynamoDB to Elasticsearch as we did in lesson 4). WIP
