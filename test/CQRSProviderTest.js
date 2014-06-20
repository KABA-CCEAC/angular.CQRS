describe('CQRSProvider', function () {

   var CQRSProvider, CQRS;

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

   beforeEach(inject(function (_CQRS_) {
      CQRS = _CQRS_;
   }));


   describe('#setUrlFactory()', function () {
      it('should url factory function successfully', function () {
         CQRSProvider.setUrlFactory(function (dataId) {
            return dataId;
         });
      });
   });


});