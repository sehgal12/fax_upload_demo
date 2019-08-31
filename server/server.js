// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-workspace
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var GridFSConnector = require('./grid_fs_conn');
var loopback = require('loopback');
var boot = require('loopback-boot');
var request = require('request');
var fs = require('fs');
var fax_json = fs.readFileSync('fax.json', 'utf8');//reading fax json stored locally
var app = module.exports = loopback();

// define database URI
const DBURI = 'mongodb://127.0.0.1:27017/ssrx';
var localGridFSConnector = new GridFSConnector(DBURI);

app.start = function () {
  // start the web server
  return app.listen(function () {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Test upload functionality
app.use('/process_fax', async function(req, res, next) {
    try{
      localGridFSConnector.uploadFax(fax_json);
      res.status(201).send('Fax file(s) successfully added to database');
    } catch (e) {
      console.log('failed to upload fax');
      console.error(e);
      res.status(500).send('Internal Server Error!');
    }
});

// Test download method
// Change filename to a valid entry in mongoDB
app.use('/download_fax', async function(req, res, next) {
  try {
    localGridFSConnector.downloadFax("519f7ec226983e6a48614677fa2ec25a.tiff", res);//change filename here
  } catch(err){
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Test metadata download method
// Change filename to a valid entry in mongoDB
app.use('/download_metadata', async function(req, res, next) {
  try {
    localGridFSConnector.getFaxMetadata("519f7ec226983e6a48614677fa2ec25a.tiff", res);
  } catch(err){
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Test search method
// Entry a valid query as the input
app.use('/query_fax', async function(req, res, next) {
  try {
    localGridFSConnector.searchFax({"metadata.name": "gigyasu"}, res);
  } catch(err){
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function (err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
