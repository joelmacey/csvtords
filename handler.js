const mysql= require('mysql');
const aws = require('aws-sdk');
const s3 = new aws.S3({
  apiVersion: '2006-03-01'
});
const fs = require('fs');
const async = require('async');
const connection = mysql.createConnection({
  host     : 'foo.bar.us-east-1.rds.amazonaws.com', //Place Endpoint Here
  user     : 'foo', //Unique User And Password for access Read & Write
  password : 'bar',
  database : 'your-schema',
  port     : '3306'
});
var destFilePath = '';
var bucket = ''; // Needs to look like /home/usr
var key =''; // Needs to look like input.txt
var params = {
  Bucket: bucket,
  Key: key,
};

console.log('Event triggered from s3.');

//This part Works!
exports.handler = (event, context, callback) =>{
  console.log('================================================================================');
  console.log('Received event:', JSON.stringify(event, null, 2));
  console.log('================================================================================');
  // Gets the object from the event and show its content type
  bucket = event.Records[0].s3.bucket.name;
  key =  decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
  params = {
    Bucket: bucket,
    Key: key,
  };

  //Starts a waterfall, meaning a flow of functions.
  async.waterfall([

    function defineDownload(next) {
      console.log('Download from: ' + bucket + '/' + key);
      //Where the File Path is defined
      destFilePath='/tmp/' + key
      next(null);
    },

    //Creates a blank file ready to be filled.
    function createLocalFile(next) {
      var destFile = fs.createWriteStream(destFilePath);
      console.log('File created locally.');
      console.log('Path: ' + destFilePath);
      next(null, destFile);
    },

    //Writes data from s3 file into blank file
    function saveFileLocally(destFile,next) {
      s3.getObject(params, (err, data) => {
        fs.writeFile(destFilePath, data.Body, function(err) {
          if (err) {
            return console.log(err);
          }
          console.log('================================================================================');
          console.log('S3  FILE INFO:', JSON.stringify(destFile, null, 2));
          console.log('================================================================================');
          console.log('File filled with data from s3: ' + bucket + '/' + key);
          console.log('Path: ' + destFilePath);
          next(null, destFilePath);
        });
      });
    },

    function runMySQL(destFilePath,next) {
    console.log('MYSQL starting.');
    console.log('Path: ' + destFilePath);

    //Some Sample MYSQL queries.
    connection.connect(function(err){
      if (err)
        console.log('Error connecting to database');
      else
        console.log('Connection established to database');
    });
    connection.query('CREATE TABLE table (firstname VARCHAR(45),lastname VARCHAR(45),number INT(45))', function(err, rows, fields) {
      if (err)
        console.log(err);
      else
        console.log('Table temp_table created.');
    });
    connection.query('LOAD DATA LOCAL INFILE "' + destFilePath + '" INTO TABLE temp_table FIELDS TERMINATED BY "|" IGNORE 1 LINES;', function(err, rows, fields) {
      if (err)
        console.log(err);
      else
        console.log('Data imported from file');
    });
    connection.query('SELECT * from supplier_city;', function(err, rows, fields) {
      if (err)
        console.log(err);
      else
        console.log(rows);
    });
    connection.end(function(err){
      if (err)
        console.log(err);
      else
        console.log ('Ended connection.');
        next(null, 'Done');
    });
  },

  ],
  function (err) {
    if (err) {
        console.error("error:" + err);
    } else {
        console.log('SUCCESS - END');
    }
  }
  ); //End of Waterfall
};
