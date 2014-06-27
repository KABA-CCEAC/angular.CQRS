describe('query', function () {

  var StoreService;

  beforeEach(function () {

    IntegrationTestHelper.setup(function (CQRSProvider) {
      CQRSProvider.setUrlFactory(function () {
        return 'http://localhost:3000/data/profile/id/53ad27e10831bf3012cd8dcd';
      });
    });

    StoreService = IntegrationTestHelper.getCollaborator('StoreService');
  });

  it('should fetch profile', function (done) {

    var store = StoreService.createForService();

    store.for('profile').do(function (result) {
      expect(result).not.to.be(undefined);
      done();
    });

  });

});
