describe('DenormalizationService', function () {

  var DenormalizationService;

  beforeEach(function () {
    angular.mock.module('ngCQRS');
  });

  beforeEach(inject(function (_DenormalizationService_) {
    DenormalizationService = _DenormalizationService_;
  }));


  describe('#registerDenormalizerFunction()', function () {
    it('should register denormalizer function successfully', function () {
      DenormalizationService.registerDenormalizerFunction('myResource', 'myaggregateType', 'myEventName', function (originalData, delta) {
        originalData[delta.id] = delta;
        return originalData;
      });
    });

    it('should not allow to register multiple functions for the same resource/event combination', function () {
      DenormalizationService.registerDenormalizerFunction('myResource', 'myaggregateType', 'myEventName', function () {
        //foo
      });

      expect(function () {
        DenormalizationService.registerDenormalizerFunction('myResource', 'myaggregateType', 'myEventName', function () {
          //foo
        });
      }).to.throwException();
    });
  });

  describe('#getDenormalizerFunctions()', function () {
    it('return empty object if aggregateType is not known', function () {
      expect(DenormalizationService.getDenormalizerFunctions('unknown')).to.eql({});
    });
    it('return empty object if eventName is not known', function () {
      DenormalizationService.registerDenormalizerFunction('profile', 'person', 'move', function(){

      });
      expect(DenormalizationService.getDenormalizerFunctions('person', 'unknown')).to.eql({});
    });
  });

});