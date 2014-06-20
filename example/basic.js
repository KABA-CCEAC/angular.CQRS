var module = angular.module('basicExample', []);

module.config(function (CQRSProvider) {

   // tell angular.CQRS how to build urls for HTTP GET queries
   CQRSProvider.setUrlFactory(function (dataId) {
      return 'http://www.my-backend.com/api/' + dataId;
   });

});

module.run(function (CQRS) {

   // connect angular.CQRS to your socket / long polling solution, etc.

   var mySocket = io();

   // pass in events from your socket
   mySocket.on('events', function (data) {
      CQRS.eventReceived(data);
   });

   // pass commands to socket
   CQRS.onCommand(function (data) {
      mySocket.emit('commands', data);
   });

});

module.controller('MainController', function ($scope, Store, CQRS) {

   // send a query to the server, requesting data with the id 'name'
   // CQRS will update your scope variable on every update event from the server
   Store.get('myProfile').then(function (data) {
      $scope.profile = data;
   });

   $scope.onClick = function () {
      CQRS.sendCommand('changeProfile', {
         id: $scope.profile.id,
         description: 'newDescription'
      });
   };

   $scope.onErase = function () {
      Store.clear();
   };

});