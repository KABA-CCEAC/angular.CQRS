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

    });

    describe('#sendCommand()', function () {

      it('should not be undefined', function () {
        expect(CQRS).not.to.be(undefined);
        expect(CQRS.sendCommand).not.to.be(undefined);
      });

      it('should emit rootScope event', function () {
        var receivedCommand;
        $rootScope.$on('CQRS:commands', function (event, command) {
          receivedCommand = command;
        });
        CQRS.sendCommand('myResource', 'update', {id: 123, name: 'marvin'});

        expect(receivedCommand.modelView).to.be('myResource');
        expect(receivedCommand.commandName).to.be('update');
        expect(receivedCommand.payload.id).to.be(123);
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
  });

});