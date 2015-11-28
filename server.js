/**
 * This file provided by Facebook is for non-commercial testing and evaluation
 * purposes only. Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var fs = require('fs');
var path = require('path');
var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var app = express();

// These two lines required to set up socket.io service
var server = http.createServer(app);
var io = require('socket.io')(server);

// Set some globals
var port = (process.env.PORT || 3000);
var COMMENTS_FILE = path.join(__dirname, 'comments.json');

// The only HTTP transfer now will be automatic, via this route
app.use('/', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


// All client-server traffic now uses socket.io, hence it's all in this handler
io.sockets.on('connection', function (client) {

  // Respond to client request to send data
  client.on('send_data', function () {
    // console.log('Got message from client');
    fs.readFile(COMMENTS_FILE, function(err, data) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
    // console.log(JSON.parse(data));
    client.emit('update', JSON.parse(data));
    });
  });

  // Handle new data sent by client
  client.on('submission', function (entry) {
    fs.readFile(COMMENTS_FILE, function(err, data) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      var comments = JSON.parse(data);
      // NOTE: In a real implementation, we would likely rely on a database or
      // some other approach (e.g. UUIDs) to ensure a globally unique id. We'll
      // treat Date.now() as unique-enough for our purposes.

      // console.log(JSON.stringify(entry));
      var newComment = {
        id: Date.now(),
        author: entry.author,
        text: entry.text,
        };
      comments.push(newComment);
      fs.writeFile(COMMENTS_FILE, JSON.stringify(comments, null, 4), function(err) {
      if (err) {
        console.error(err);
        process.exit(1);
        }
      // Yay!!  The watcher will take care of this automatically
      // client.emit('update', comments);
      });
    });
  });

  // Keep an eye for local changes to the data file
  //   Used to handle both local edits and client-driven updates to file
  fs.watchFile(
    'comments.json',
    function ( current, previous ) {
      // console.log( 'file accessed' );
      // Send notice
      if ( current.mtime !== previous.mtime ) {
        console.log( 'file changed -- sending update');
        fs.readFile(COMMENTS_FILE, function(err, data) {
          if (err) {
            console.error(err);
            process.exit(1);
          }
        // console.log('Emitting' + data);
        client.emit('update', JSON.parse(data));
      });
    }
  });
});

server.listen(port);
console.log('Server running on port ' + port);
//(app.get('port'), function() {
//  console.log('Server started: http://localhost:' + app.get('port') + '/');
//});
