var module = angular.module('basicExample', ['ngCQRS']);

module.config(function (CQRSProvider) {

  // tell angular.CQRS how to build urls for HTTP GET queries
  CQRSProvider.setUrlFactory(function (viewModelName, parameters) {
    return 'http://www.my-backend.com/api/' + viewModelName + CQRSProvider.toUrlGETParameterString(parameters);
  });

});

module.run(function (CQRS, DenormalizationService) {

  // connect angular.CQRS to your socket / long polling solution, etc.

  var mySocket = io();

  // pass in events from your socket
  mySocket.on('events', function (data) {
    CQRS.eventReceived(data);
  });

  // pass commands to your socket
  CQRS.onCommand(function (data) {
    mySocket.emit('commands', data);
  });

  // Tell angular.CQRS how to denormalize (or merge) "moved" events on the aggregate type "person" for the "profile" ModelView.
  DenormalizationService.registerDenormalizerFunction('profile', 'person', 'moved', function (oldProfile, eventPayload) {
    if (eventPayload.id === oldProfile.person.id) {
      oldProfile.person.address = eventPayload.address;
    }

    return oldProfile;
  });

});

module.controller('MainController', function ($scope, StoreService, CQRS) {

  var store = StoreService.createForController($scope);

  // send a query to the server, requesting data with the id 'name'
  // angular.CQRS will invoke your callback on every update event from the server
  store.for('profile').do(function (profileData) {
    $scope.profile = profileData;
  });

  $scope.onChangeProfile = function () {

    // Send a "move" command for the aggregate "person" to the server
    CQRS.sendCommand('person', 'move', {
      id: $scope.profile.id,
      address: 'my entered new address'
    });
  };

});
