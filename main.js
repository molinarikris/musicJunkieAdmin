var express = require('express');
var songs = require('mongode2')('musicJunkie', 'songs');
var bodyParser = require('body-parser');
var busboy = require('connect-busboy');
var path = require('path');
var fs = require('fs');
var logger = require('morgan');

var fstream = fs.createWriteStream(__dirname + 'adminLogs.log',{flags:'a'})

var app = express();
var router = express.Router();

app.use(busboy({immediate:true}));
app.use(logger('combined', {
  stream: fstream
}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

/* ------ Routing Table ------ */

app.use('/media/', express.static(path.join(__dirname, 'assets/')));

router.post('/newSong', function(req, res) {
  if (req.busboy) {
    req.busboy.on('file', function(field, file, filename) {
      var target = path.join(__dirname, 'assets/', path.basename(filename) + '.mp3');
      file.pipe(fs.createWriteStream(target));
      console.log('check');
    });
    req.busboy.on('finish', function() {
      console.log('done');
      res.send('ok');
    });
  }
});

router.post('/newMeta/:type', bodyParser.json(), function(req, res) {
  songs.create(req.body, function(err, end) {
    err ? console.log(err) : res.sendStatus(200);
  });
});

/* PurgeDB route. ONLY USED IN DEVELOPMENT
router.get('/purge', function(req, res, next) {
  fs.readdir(path.join(__dirname, 'assets/'), function(err, files) {
    if (!err) {
      files.forEach(function(v, i) {
        fs.unlink(path.join(__dirname, 'assets', v), function(err) {
          err ? res.send(500) : function() {} ;
        });
      })
    }
  });
  songs.delete({}, function(err, res) {
    err ? res.send(500) : function() {} ;
  });
  next();
}, function(req, res) {
  res.sendStatus(200);
});
*/

router.get('/activities', function(req, res) {
  songs.read(function(err, docs) {
    res.json(docs.sort(function(a, b) {
      if (a.date > b.date) {
        return 1;
      } else if (a.date < b.date) {
        return -1;
      } else {
        return 0;
      }
    }));
  })
});

router.get('/playlists/all', function(req, res) {
  songs.aggregate([
    {
      $group: {
        _id: {
          playlist: "$genre",
        }
      }
    },
    {
      $sort: {
        "_id.playlist": 1
      }
    }
  ], {}, function(err, docs) {
    console.log(err);
    res.json(docs);
  })
})

router.get('/playlists/:gnid', function(req, res) {
  console.log("It asked");
  songs.read({genre: req.params.gnid}, function(err, docs) {
    if (err) console.error(err);
    res.json(docs);
  })
})

router.post('/songs/remove', bodyParser.json(), function(req, res) {
  songs.delete({id: {$in: req.body.ids}}, function(err, result) {
    console.log(err);
    console.log(result);
    res.sendStatus(200);
  })
})

app.use('/', router);

module.exports = app;
