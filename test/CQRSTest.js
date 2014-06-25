describe('CQRS', function () {

  var CQRSProvider, CQRS, $httpBackend, $rootScope;

  beforeEach(function () {
    // Initialize the service provider by injecting it to a fake module's config block
    var fakeModule = angular.module('testApp', function () {
    });

    fakeModule.config(function (_CQRSProvider_) {
      CQRSProvider = _CQRSProvider_;
    });

    // Initialize ngCQRS module injector
    angular.mock.module('ngCQRS', 'testApp');

    // Kickstart the injectors previously registered with calls to angular.mock.module
    inject(function () {
    });
  });

  beforeEach(inject(function (_CQRS_, _$httpBackend_, _$rootScope_) {
    CQRS = _CQRS_;
    $httpBackend = _$httpBackend_;
    $rootScope = _$rootScope_;
  }));


  beforeEach(function () {
    CQRSProvider.setUrlFactory(function (dataId) {
      return 'http://www.example.com/api/' + dataId;
    });
  });

  describe('#query()', function () {

    it('should not be undefined', function () {
      expect(CQRS).not.to.be(undefined);
      expect(CQRS.query).not.to.be(undefined);
    });

    it('should call defined url', function () {
      var data = {id: 123, name: 'marvin'};
      $httpBackend.expectGET('http://www.example.com/api/myResource').respond(data);
      var response = CQRS.query('myResource');
      $httpBackend.flush();
      expect(response).to.equal(data);
    });

  });

  describe('#sendCommand()', function () {

    it('should not be undefined', function () {
      expect(CQRS).not.to.be(undefined);
      expect(CQRS.sendCommand).not.to.be(undefined);
    });

    it('should emit rootScope event', function () {
      var command = {resource: 'myResource', commandName: 'update', payload: {id: 123, name: 'marvin'}};
      var receivedCommand;
      $rootScope.$on('CQRS:commands', function (event, command) {
        receivedCommand = command;
      });
      CQRS.sendCommand(command);

      expect(receivedCommand).to.be(command);
    });

  });

  describe('#onCommand()', function () {

    it('should not be undefined', function () {
      expect(CQRS).not.to.be(undefined);
      expect(CQRS.onCommand).not.to.be(undefined);
    });

    it('should register listener and call listener on CQRS.commands event', function () {
      var success = false;
      var listener = function () {
        success = true;
      };
      CQRS.onCommand(listener);

      $rootScope.$emit('CQRS:commands', {});

      expect(success).to.be(true);
    });

  });

  describe('#eventReceived()', function () {

    it('should not be undefined', function () {
      expect(CQRS).not.to.be(undefined);
      expect(CQRS.eventReceived).not.to.be(undefined);
    });

    it('should emit data', function () {
      var event = {resource: 'myResource', commandName: 'update', payload: {id: 123, name: 'marvin'}};

      var receivedEvent;
      $rootScope.$on('CQRS:events', function (angularEvent, event) {
        receivedEvent = event;
      });

      CQRS.eventReceived(event);

      expect(receivedEvent).to.be(event);
    });

  });

  describe('#onEvent()', function () {

    it('should not be undefined', function () {
      expect(CQRS).not.to.be(undefined);
      expect(CQRS.onEvent).not.to.be(undefined);
    });

    it('should register listener and call listener on CQRS.events event', function () {
      var success = false;
      var listener = function () {
        success = true;
      };
      CQRS.onEvent(listener);

      $rootScope.$emit('CQRS:events', {});

      expect(success).to.be(true);
    });

  });

  beforeEach(function () {
    CQRSProvider.registerDenormalizerFunctions('myResource', 'myEventName', function (originalData, delta) {
      if (angular.isDefined(originalData) && angular.isDefined(delta)) {
        return 'success';
      }
    });
  });

  describe('#denormalize()', function () {

    it('should denormalize with registered function', function () {
      var origData = {id: 22, name: 'sergio'};
      var testEvent = {viewModel: 'myResource', eventName: 'myEventName', payload: {id: 22, name: 'marvin'}};
      expect(CQRS.denormalize(testEvent, origData, testEvent.payload)).to.be('success');
    });

    it('should return delta if no denormalizer function found', function () {
      var origData = {id: 22, name: 'sergio'};
      var testEvent = {resource: 'myResource', eventName: 'myOtherEvent', payload: {id: 22, name: 'marvin'}};
      expect(CQRS.denormalize(testEvent, origData, testEvent.payload)).to.be(testEvent.payload);
    });

  });

});