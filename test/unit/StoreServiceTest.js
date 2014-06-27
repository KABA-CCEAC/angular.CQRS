describe('StoreService', function () {

  var CQRSProvider, StoreService, DenormalizationService, $rootScope, $httpBackend, dummyScope = {
    $id: 1,
    $on: function () {
    }
  };

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

  beforeEach(inject(function (_$rootScope_, _$httpBackend_, _StoreService_, _DenormalizationService_) {
    StoreService = _StoreService_;
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    DenormalizationService = _DenormalizationService_;
  }));

  beforeEach(function () {
    CQRSProvider.setUrlFactory(function (modelView) {
      return 'http://www.example.com/api/' + modelView;
    });
  });

  describe('#createForService()', function () {
    it('should register callback for service', function () {

      DenormalizationService.registerDenormalizerFunction({
        viewModelName: 'myProfile',
        aggregateType: 'person',
        eventName: 'move'
      }, function (oldData, payload) {
        return payload;
      });

      function simulateEvent() {
        var event = {aggregateType: 'person', name: 'move', payload: {}};
        $rootScope.$emit('CQRS:events', event);
      }

      var invokeCounter = 0;
      var store = StoreService.createForService();

      $httpBackend.when('GET', 'http://www.example.com/api/myProfile').respond({foo: 'bar'});
      store.for('myProfile').do(function () {
        invokeCounter++;
      });

      $httpBackend.flush();

      simulateEvent();
      expect(invokeCounter).to.be(2);
    });
  });

  describe('#createForController()', function () {

    it('should correctly deregister viewModelName event callbacks', function () {


      DenormalizationService.registerDenormalizerFunction({
        viewModelName: 'myProfile',
        aggregateType: 'person',
        eventName: 'move'
      }, function (oldData, payload) {
        return payload;
      });


      function simulateEvent() {
        var event = {aggregateType: 'person', name: 'move', payload: {}};
        $rootScope.$emit('CQRS:events', event);
      }

      var scopeEventHandlerFunction;
      var invokeCounter = 0;
      var store = StoreService.createForController({
        $id: 2,
        $on: function (name, callback) {
          scopeEventHandlerFunction = callback;
        }
      });

      $httpBackend.when('GET', 'http://www.example.com/api/myProfile').respond({foo: 'bar'});
      store.for('myProfile').do(function () {
        invokeCounter++;
      });

      $httpBackend.flush();

      simulateEvent();
      expect(invokeCounter).to.be(2);
      scopeEventHandlerFunction({currentScope: {$id: 2}});
      simulateEvent();
      expect(invokeCounter).to.be(2);
    });


    it('should correctly deregister one callback for same viewModelName event', function () {

      DenormalizationService.registerDenormalizerFunction({
        viewModelName: 'myProfile',
        aggregateType: 'person',
        eventName: 'move'
      }, function (oldData, payload) {
        return payload;
      });


      function simulateEvent() {
        var event = {aggregateType: 'person', name: 'move', payload: {}};
        $rootScope.$emit('CQRS:events', event);
      }

      var scopeEventHandlerFunction;
      var invokeCounterOne = 0, invokeCounterTwo = 0;
      var storeOne = StoreService.createForController({
        $id: 2,
        $on: function (name, callback) {
          scopeEventHandlerFunction = callback;
        }
      });
      var storeTwo = StoreService.createForController({
        $id: 5,
        $on: function (name, callback) {
          scopeEventHandlerFunction = callback;
        }
      });

      $httpBackend.when('GET', 'http://www.example.com/api/myProfile').respond({foo: 'bar'});
      storeOne.for('myProfile').do(function () {
        invokeCounterOne++;
      });
      storeTwo.for('myProfile').do(function () {
        invokeCounterTwo++;
      });
      $httpBackend.flush();

      simulateEvent();
      expect(invokeCounterOne).to.be(2);
      expect(invokeCounterTwo).to.be(2);
      scopeEventHandlerFunction({currentScope: {$id: 2}});
      simulateEvent();
      expect(invokeCounterOne).to.be(2);
      expect(invokeCounterTwo).to.be(3);
    });

  });

  describe('#store#for()', function () {
    var store;

    beforeEach(function () {
      store = StoreService.createForController(dummyScope);
    });

    it('should throw error on invalid modelName', function () {
      expect(function () {
        store.for(function () {
        }, {}).do(function () {
        });
      }).to.throwException();
    });

    it('should throw error on missing modelName', function () {
      expect(function () {
        store.for(undefined, {}).do(function () {
        });
      }).to.throwException();
    });

    it('should throw error on invalid callback', function () {
      expect(function () {
        store.for('myResource', {}).do('asdf');
      }).to.throwException();
    });

    it('should throw error on invalid parameters object', function () {
      expect(function () {
        store.for('myResource', function () {
        }).do(function () {
        });
      }).to.throwException();
    });

    it('should allow undefined parameters object', function () {
      store.for('myResource', undefined).do(function () {
      });
    });

    it('should invoke callback', function () {
      var dummyDataId = '1234';

      $httpBackend.expect('GET', 'http://www.example.com/api/1234').respond({
        id: '1234',
        attributeOne: 'attributeOneValue'
      });

      var response;
      store.for(dummyDataId, {}).do(function (result) {
        response = result;
      });

      $httpBackend.flush();

      expect(response.id).to.equal(dummyDataId);
    });
  });

  describe('#onEvent()', function () {
    var store;

    beforeEach(function () {
      store = StoreService.createForController(dummyScope);
    });

    it('should notify all subscribed callbacks on new event', function () {

      DenormalizationService.registerDenormalizerFunction({
        viewModelName: 'myProfile',
        aggregateType: 'person',
        eventName: 'move'
      }, function (oldData, payload) {
        return payload;
      });

      $httpBackend.when('GET', 'http://www.example.com/api/myProfile').respond({foo: 'bar'});

      var callback1, callback2;
      store.for('myProfile', {}).do(function (persons) {
        callback1 = persons;
      });
      store.for('myProfile', {}).do(function (persons) {
        callback2 = persons;
      });

      $httpBackend.flush();

      var newAddress = {id: 123, street: 'Hauptweg'};
      var event = {aggregateType: 'person', name: 'move', payload: newAddress};
      $rootScope.$emit('CQRS:events', event);

      expect(callback1).to.be(newAddress);
      expect(callback2).to.be(newAddress);
    });

    it('should NOT notify callbacks on invalid event (missing resource identifier)', function () {
      var initialQueryData = {foo: 'bar'};
      $httpBackend.when('GET', 'http://www.example.com/api/myProfile').respond(initialQueryData);

      var callback1, callback2;
      store.for('myProfile', {}).do(function (persons) {
        callback1 = persons;
      });
      store.for('myProfile', {}).do(function (persons) {
        callback2 = persons;
      });

      $httpBackend.flush();

      var newAddress = {id: 123, street: 'Hauptweg'};
      var event = {eventName: 'move', payload: newAddress};
      $rootScope.$emit('CQRS:events', event);

      expect(callback1.foo).to.be(initialQueryData.foo);
      expect(callback2.foo).to.be(initialQueryData.foo);
    });

    it('should NOT notify callbacks on invalid event (missing eventName)', function () {
      var initialQueryData = {foo: 'bar'};
      $httpBackend.when('GET', 'http://www.example.com/api/myProfile').respond(initialQueryData);

      var callback1, callback2;
      store.for('myProfile', {}).do(function (persons) {
        callback1 = persons;
      });
      store.for('myProfile', {}).do(function (persons) {
        callback2 = persons;
      });

      $httpBackend.flush();

      var newAddress = {id: 123, street: 'Hauptweg'};
      var event = {viewModel: 'myProfile', payload: newAddress};
      $rootScope.$emit('CQRS:events', event);

      expect(callback1.foo).to.be(initialQueryData.foo);
      expect(callback2.foo).to.be(initialQueryData.foo);
    });

    it('should NOT notify callbacks on invalid event (missing payload)', function () {
      var initialQueryData = {foo: 'bar'};
      $httpBackend.when('GET', 'http://www.example.com/api/myProfile').respond(initialQueryData);

      var callback1 , callback2;
      store.for('myProfile', {}).do(function (persons) {
        callback1 = persons;
      });
      store.for('myProfile', {}).do(function (persons) {
        callback2 = persons;
      });

      $httpBackend.flush();

      var event = {viewModel: 'myProfile', eventName: 'move'};
      $rootScope.$emit('CQRS:events', event);

      expect(callback1.foo).to.be(initialQueryData.foo);
      expect(callback2.foo).to.be(initialQueryData.foo);
    });


    it('should invoke denormalizer and callback correctly on event', function () {

      var initialQueryData = {foo: 'bar'};
      $httpBackend.when('GET', 'http://www.example.com/api/myProfile').respond(initialQueryData);

      var store = StoreService.createForService();
      var callbackData = [];
      store.for('myProfile').do(function (data) {
        callbackData.push(data);
      });
      $httpBackend.flush();

      var newAddress = {id: 123, street: 'Hauptweg'};
      DenormalizationService.registerDenormalizerFunction({
        viewModelName: 'myProfile',
        aggregateType: 'person',
        eventName: 'move'
      }, function (originalData, change) {
        expect(originalData).to.eql(initialQueryData);
        expect(change).to.eql(newAddress);
        return change;
      });

      var event = {aggregateType: 'person', name: 'move', payload: newAddress};
      $rootScope.$emit('CQRS:events', event);

      expect(callbackData).to.eql([initialQueryData, newAddress]);
    });


  });


});
