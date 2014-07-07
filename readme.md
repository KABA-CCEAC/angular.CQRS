# Introduction

Project goal is to simplify the usage of the CQRS Pattern under AngularJS by 
providing needed infrastructure. This module is inspired by http://jamuhl.github.io/backbone.CQRS/.

Tested with AngularJS 1.2.18



### Status
| Branch        | Status         |
| ------------- |:-------------:|
| master        | [![Build Status](https://api.travis-ci.org/KABA-CCEAC/angular.CQRS.png?branch=master)](https://travis-ci.org/KABA-CCEAC/angular.CQRS) |
| develop        | [![Build Status](https://api.travis-ci.org/KABA-CCEAC/angular.CQRS.png?branch=develop)](https://travis-ci.org/KABA-CCEAC/angular.CQRS) |

### Docu

[API documentation](http://kaba-cceac.github.io/angular.CQRS/#/api)

# Usage

To use CQRS on the clientside we will need to push _events_ 
to the browser. You can achieve this via websockets, flash, long polling or any 
other technique around.



## Configuration

In order to use angular.CQRS, add it to the list of dependencies of your module.

	var module = angular.module('basicExample', ['ngCQRS']);



angular.CQRS will send queries to the server via HTTP GET to fetch data. You can configure how the URLS for these GET requests should be composed.


	module.config(function (CQRSProvider) { 

	  CQRSProvider.setUrlFactory(function (viewModelName, parameters) {
	    return 'https://www.my-backend.com/api/' + viewModelName + CQRSProvider.toUrlGETParameterString(parameters);
	  });

	});


### Wire up commands and events to/from sever

In order to connect angular.CQRS to your websocket / long polling solution, wire up commands and events.

    var mySocket = io();

    // pass in events from your socket
    mySocket.on('events', function (data) {
      CQRS.eventReceived(data);
    });

    // pass commands to your socket
    CQRS.onCommand(function (data) {
      mySocket.emit('commands', data);
    });


In order to update your view data on an incoming server event, we use denormalization functions.


    // Tell angular.CQRS how to denormalize (or merge) "moved" events on the aggregate type "person" for the "profile" ModelView.
    DenormalizationService.registerDenormalizerFunction({
          viewModelName: 'myProfile',
          aggregateType: 'person',
          eventName: 'move'
        }, function (oldProfile, eventPayload) {
          if (eventPayload.id === oldProfile.person.id) {
              oldProfile.person.address = eventPayload.address;
          }

        return oldProfile;
    });

## Usage in your controllers and services


    module.controller('MainController', function ($scope, StoreService, CQRS) {

        // create a store instance for your current controller scope.
        // this is needed in order to correctly cleanup any event handlers after the angular scope is destroyed.
        var store = StoreService.createForController($scope);

        // send a query to the server, requesting the view 'profile'
        // angular.CQRS will invoke your callback on the first response and on every subsequent update from the server
        // the profileData you get will be denormalized by the denormalization function you registered
        store.for('profile').do(function (profileData) {
            $scope.profile = profileData;
        });

        $scope.onChangeProfile = function () {

            // Send a "move" command for the aggregate "person" to the server
           CQRS.sendCommand({
             command: 'move',
             aggregateType: 'person',
             payload: {
               street: 'new Streetname',
               id: profile.person.id
             }
           });
        };

    });
