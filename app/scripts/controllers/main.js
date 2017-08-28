'use strict';

/**
 * @ngdoc function
 * @name musicJunkieCdnApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the musicJunkieCdnApp
 */
 var apiUrl = "https://api.kriswithak.io/";

 function randInt(min, max) {
   if (typeof min === 'number' && typeof max === 'number') {
     return Math.floor(Math.random()*(max - min)) + min;
   } else {
     return new Error("randInt: Type Error.\n randInt requires two arguments that are numbers.");
   }
}
angular.module('musicJunkieCdnApp')
  .config(['$httpProvider', function($httpProvider) {
          $httpProvider.defaults.useXDomain = true;
          delete $httpProvider.defaults.headers.common['X-Requested-With'];
      }
  ])
  .directive('modal', function() {
    return {
      templateUrl: 'views/modal.html',
      scope: {
        message: "="
      },
      restrict: 'A',
      link: function(scope, elem, attrs) {
        scope.$watch(attrs.triggerOn, function(val) {
          val ? elem.modal('show') : elem.modal('hide')
        });
      }
    }
  })
  .controller('GlobalCtrl', ['$scope', '$location',
    function(s, l) {
  /* <--- start GlobalCtrl ---> */
    s.isActive = function(loc) {
      return loc === l.path();
    }
    s.showingModal = false;
    s.toggleModal = function() {
      s.showingModal ? (s.showingModal = false) : (s.showingModal = true)
    }
  /* <---- end GlobalCtrl ----> */
  }])
  .controller('HomeCtrl', ['$scope', '$http',
    function (s, h) {


  }])
  .controller('SongCtrl', ['$scope', '$http', 'Upload', '$timeout',
    function(s, h, u, t) {
      // lol, shut. I didn't even do that on purpose

  /* <--- start SongCtrl ---> */
    s.song = {};
    function guid() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }
    function comment() {
      var neat_list = [
        "Neat!",
        "Rad!",
        "Awesome!",
        "Fantastic!",
        "Interesting!",
        "Such knowledge!",
        "Wow!",
        "Much impress!",
        "How about that!",
        "Cool!",
        "Wowzers!",
        "Woah!",
        "Thanks!",
        "Fascinating!"
      ];
      return neat_list[randInt(0, neat_list.length - 1)]
    }
    var fetch = function() {
      h.get(apiUrl + 'activities').then(function(res) {
        s.activities = [];
        if (res.data.length) {
          res.data.forEach(function(it) {
            console.log(it);
            var type = "panel-success";
            var message = "Added " +
              it.title + " by " +
              it.artist + ".";
            s.activities.push({
              type: type,
              date: it.date,
              msg: message,
              comment: comment()
            })
          })
        }
      }, function(err) {
        s.toggleModal();
        console.log(err);
      });
    };
    fetch();
    s.songSubmit = function(song) {
      var uid = guid();
      var smd = {
        title: song.title,
        artist: song.artist,
        album: song.album || song.title + " -- Single",
        genre: song.genre,
        id: uid,
        date: Date.now()
      };
      h.post(apiUrl + 'newMeta/song', smd).then(function(res) {
        console.log(res);
      }, function(err) {
        console.log(err);
      });
      uploadSong(song.buffer, uid);
    }
    function uploadSong(file, id) {
      u.upload({
        url: apiUrl + 'newSong',
        data: {
          file: u.rename(file, id)
        }
      }).then(function(res) {
        t(function() {
          console.log("Success! \n");
          fetch();
          s.currentShow = '';
          s.loading = null;
          s.song = {};
        }, 1000);
      }, function(err) {
        console.log("Uh oh! \n" + JSON.stringify(err));
      }, function(evt) {
        s.loading = parseInt(100.0 * evt.loaded / evt.total) + "%";
      });
    };
    s.purge = function() {
      h.get(apiUrl + 'purge').then(function(res) {
        console.log("Success! \n" + JSON.stringify(res));
        fetch();
        s.currentShow = '';
      }, function(err) {
        console.log("Uh oh! \n" + JSON.stringify(err));
      });
    };
    window.checkID3 = function(file) {
      musicmetadata(file, function(err, res) {
        if (err) throw err;
        s.song.title = res.title;
        s.song.artist = res.artist.toString();
        s.song.album = res.album;
      });
    }
    s.primaryGenres = [
      "R&B/Hip-Hop",
      "Pop",
      "Country",
      "Rock",
      "Jazz",
      "Electronica"
    ];
    h.get(apiUrl + 'playlists/all').then(function(res) {
      if (res.data.length) {
        s.emptyPlaylist ? s.emptyPlaylist = false : {};
        s.secondaryGenres = [];
        res.data.forEach(function(it) {
          if (!(s.primaryGenres.indexOf(it._id.playlist) + 1)) {
            s.secondaryGenres.push(it._id.playlist);
          }
        });
      } else {
        s.emptyPlaylist = true;
      }
    }, function(err) {
      console.log(err);
    })
  /* <---- end SongCtrl ----> */
  }])
  .controller('PlayCtrl', ['$scope', '$http', '$timeout',
    function(s, h, t) {

    s._listCache = {};
    s.currentShow = 'listView';
    h.get(apiUrl + 'playlists/all').then(function(res) {
      s.playlists = [];
      res.data.forEach(function(it) {
        s.playlists.push(it._id.playlist);
      })
    });
    s.currentShow = '';
    s.activeList = {};
    s.toggleView = function(list) {
      if (list) {
        s.activeList.title = list;
        s.activeList.songs = [];
        if (!s._listCache[list]) {
          h.get(apiUrl + 'playlists/' + encodeURIComponent(list)).then(function(res) {
            s._listCache[list] = [];
            res.data.forEach(function(it) {
              it.toEdit = false;
              s._listCache[list].push(it);
              s.activeList.songs.push(it);
              s.currentShow = list;
            });
          }, function(err) {
            console.log(err);
          })
        } else {
          s.activeList.songs = s._listCache[list]
          s.currentShow = list;
        }
      } else {
        s.currentShow = '';
      }
    }
    s.mods = [];
    s.toggleMods = function(song) {
      if (s.mods.indexOf(song.id) + 1) {
        s.mods = s.mods.filter(function(it) {
          if (it == song.id) {
            return false;
          }
          return true;
        });
      } else {
        s.mods.push(song.id);
      }
    }
    s.editList = function(plist, deltas) {
      var data = {
        ids: deltas
      };
      h.post(apiUrl + 'songs/remove', data).then(function(res) {
        s.currentShow = '';
        s.successShow = true;
        t(function() {
          s.successShow = false;
        }, 5000);
      }, function(err) {
        console.log(err);
      })
    }
  }]);
