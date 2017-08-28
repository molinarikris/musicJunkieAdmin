'use strict';

/**
 * @ngdoc overview
 * @name musicJunkieCdnApp
 * @description
 * # musicJunkieCdnApp
 *
 * Main module of the application.
 */
angular
  .module('musicJunkieCdnApp', [
    'ngAnimate',
    'ngRoute',
    'ngSanitize',
    'ngFileUpload'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/home.html',
        controller: 'HomeCtrl'
      })
      .when('/songs', {
        templateUrl: 'views/song.html',
        controller: 'SongCtrl'
      })
      .when('/playlists', {
        templateUrl: 'views/plays.html',
        controller: 'PlayCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
