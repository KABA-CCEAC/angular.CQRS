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

  describe('with invalid url factory', function () {
    describe('#query()', function () {
      it('should throw an error, since no url factory function is registered', function () {
        expect(function () {
          CQRS.query({}, {});
        }).to.throwException();
      });
    });
  });

  describe('with valid url factory', function () {
    beforeEach(function () {
      CQRSProvider.setUrlFactory(function (modelView, parameters) {
        return 'http://www.example.com/api/' + modelView + CQRSProvider.toUrlGETParameterString(parameters);
      });
    });

    describe('#query()', function () {

      it('should not be undefined', function () {
        expect(CQRS).not.to.be(undefined);
        expect(CQRS.query).not.to.be(undefined);
      });

      it('should call defined url', function () {
        var data = {id: 123, name: 'marvin'};
        $httpBackend.expectGET('http://www.example.com/api/myResource?filter=something').respond(data);
        var response = CQRS.query('myResource', {filter: 'something'});
        $httpBackend.flush();
        expect(response).to.equal(data);
      });

      it('should parse query response', function () {
        CQRSProvider.setQueryParser(function (data) {
          return data.content;
        });

        var data = {content: {id: 123, name: 'marvin'}};
        $httpBackend.expectGET('http://www.example.com/api/myResource?filter=something').respond(data);
        var response = CQRS.query('myResource', {filter: 'something'});
        $httpBackend.flush();
        expect(response).to.eql(data.content);
      });

    });

    describe('#sendCommand()', function () {

      it('should not be undefined', function () {
        expect(CQRS).not.to.be(undefined);
        expect(CQRS.sendCommand).not.to.be(undefined);
      });

      it('should emit rootScope event', function () {

        var dummyPayload = {id: 123, address: 'Heimweg'} , commandSent = {};
        CQRS.onCommand(function (data) {
          commandSent = data;
        });

        CQRS.sendCommand({
          command: 'move',
          payload: dummyPayload,
          aggregateType: 'person'
        });

        // CQRS will assign a unique command id!
        expect(commandSent.id).not.to.be(undefined);
        expect(commandSent.command).to.be('move');
        expect(commandSent.aggregateType).to.be('person');
        expect(commandSent.payload).to.eql(dummyPayload);

      });

      it('should not override already specified command id', function () {

        var dummyPayload = {id: 123, address: 'Heimweg'} , commandSent = {};
        CQRS.onCommand(function (data) {
          commandSent = data;
        });

        CQRS.sendCommand({
          id: 'customId-123',
          command: 'move',
          payload: dummyPayload,
          aggregateType: 'person'
        });

        // CQRS will not override command id!
        expect(commandSent.id).to.be('customId-123');
        expect(commandSent.command).to.be('move');
        expect(commandSent.aggregateType).to.be('person');
        expect(commandSent.payload).to.eql(dummyPayload);

      });


      it('should emit rootScope event without optional aggregateType specified', function () {

        var dummyPayload = {id: 123, address: 'Heimweg'} , commandSent = {};
        CQRS.onCommand(function (data) {
          commandSent = data;
        });

        CQRS.sendCommand({
          command: 'move',
          payload: dummyPayload
        });

        expect(commandSent.command).to.be('move');
        expect(commandSent.payload).to.eql(dummyPayload);

      });


      it('should allow to specify a callback function', function () {
        CQRS.sendCommand({
          command: 'move',
          payload: {attribute: 'one'}
        }, function callback() {
          // this will be invoked as soon as the event triggered by this command returned
        });
      });

      it('should not allow to pass a non-function as a callback', function () {
        expect(function () {
          CQRS.sendCommand({
            command: 'move',
            payload: {attribute: 'one'}
          }, 'thisIsNotAFunction');
        }).to.throwError();
      });

      it('should invoke "onCommand"-callback ', function (done) {

        var commandId = 'customId-444';

        CQRS.sendCommand({
          id: commandId,
          command: 'move',
          payload: {attribute: 'one'}
        }, function callback() {
          // this will be invoked as soon as the event triggered by this command returned
          done();
        });

        // this is called by the Store, in real-life
        CQRS.onEvent(function () {
          // foo
        });

        // simulate event from server
        CQRS.eventReceived({
          commandId: commandId
        });

      });

      it('should invoke "onCommand"-callback only once!', function (done) {

        var commandId = 'customId-444',
          callbackInvokeCounter = 0;

        CQRS.sendCommand({
          id: commandId,
          command: 'move',
          payload: {attribute: 'one'}
        }, function callback() {
          callbackInvokeCounter++;
          // should only get invoked once!
          expect(callbackInvokeCounter).to.be.lessThan(2);
        });

        // this is called by the Store, in real-life
        CQRS.onEvent(function () {
          // foo
        });

        // simulate event from server
        CQRS.eventReceived({
          commandId: commandId
        });

        // simulate second event from server with same commandId
        CQRS.eventReceived({
          commandId: commandId
        });

        // if callback is not invoked twice within 1/2 second,
        // we assume that the callback was properly removed after first invocation.
        setTimeout(done, 500);

      });

      // alternatively, you can use the promise object that is returned
      // it will be resolved as soon as the event triggered by this command returned ( same as callback function )
      it('should return a promise object', function () {
        var promise = CQRS.sendCommand({
          command: 'move',
          payload: {attribute: 'one'}
        });

        expect(promise).not.to.be(undefined);
        expect(promise.then).to.be.a('function');
      });

      it('should also return a promise object if callback function is specified directly', function () {
        var promise = CQRS.sendCommand({
          command: 'move',
          payload: {attribute: 'one'}
        }, function () {
          // my callback
        });

        expect(promise).not.to.be(undefined);
        expect(promise.then).to.be.a('function');
      });

      it('should resolve promise', function (done) {

        var commandId = 44;
        var promise = CQRS.sendCommand({
          id: commandId,
          command: 'move',
          payload: {attribute: 'one'}
        });

        promise.then(function () {
          done();
        });


        // this is called by the Store, in real-life
        CQRS.onEvent(function () {
          // foo
        });

        // simulate event from server
        CQRS.eventReceived({
          commandId: commandId
        });

        // manually apply rootScope which triggers promises to be resolved
        $rootScope.$apply();

      });
      it('should resolve promise with event and invoke callback', function (done) {

        var callbackInvoked = false;
        var promiseResolved = false;

        var commandId = 44;
        var promise = CQRS.sendCommand({
          id: commandId,
          command: 'move',
          payload: {attribute: 'one'}
        }, function (event) {
          callbackInvoked = true;
          expect(event).not.to.be(undefined);
          expect(event.commandId).to.be(commandId);
          if (promiseResolved) {
            done();
          }
        });

        promise.then(function (event) {
          promiseResolved = true;
          expect(event).not.to.be(undefined);
          expect(event.commandId).to.be(commandId);
          if (callbackInvoked) {
            done();
          }
        });


        // this is called by the Store, in real-life
        CQRS.onEvent(function () {
          // foo
        });

        // simulate event from server
        CQRS.eventReceived({
          commandId: commandId
        });

        // manually apply rootScope which triggers promises to be resolved
        $rootScope.$apply();

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

        var receivedEvent = {};
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

      it('should parse incoming event data', function () {
        CQRSProvider.setEventParser(function (data) {
          return data.content;
        });

        var receivedData;
        var listener = function (data) {
          // CQRS should pass in already parsed data...
          receivedData = data;
        };
        CQRS.onEvent(listener);


        var emmittedData = {content: {attributeOne: 'valueOne'}};
        $rootScope.$emit('CQRS:events', emmittedData);

        expect(receivedData).to.eql(emmittedData.content);
      });

    });
  });

});
