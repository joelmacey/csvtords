# CSV to RDS
###*A library to push a csv file to RDS*

Simple Library to place data in a CSV file to a Amazon RDS or database table.

- Includes Serverless.com framework
- Includes Lambda-Local for local testing

##How to Test Lambda Locally with the Package *Lambda-Local*
Run
```
lambda-local -l handler.js -e node_modules/lambda-local/event-samples/s3-put.js
```
Will run a s3 put event.
To set this to your own bucket & key edit the s3-put.js file.
