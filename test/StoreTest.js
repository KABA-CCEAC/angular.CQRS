describe('Store', function () {

   var CQRSProvider, Store, $rootScope, $httpBackend;

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

   beforeEach(inject(function (_$rootScope_, _Store_, _$httpBackend_) {
      Store = _Store_;
      $rootScope = _$rootScope_;
      $httpBackend = _$httpBackend_;
   }));

   beforeEach(function () {
      CQRSProvider.setUrlFactory(function (dataId) {
         return 'http://www.example.com/api/' + dataId;
      });
   });

   describe('#get()', function () {
      it('should invoke callback', function () {
         var dummyDataId = '1234';

         $httpBackend.expect('GET', 'http://www.example.com/api/1234').respond({
            id: '1234',
            attributeOne: 'attributeOneValue'
         });

         Store.get(dummyDataId, function (result) {
            expect(result.id).to.equal(dummyDataId);
         });

         // call apply on the rootScope to trigger promise resolve
         $rootScope.$apply();
      });
   });

   describe('#clear()', function () {
      it('should clear the store', function () {
         Store.clear();
      });
   });

});