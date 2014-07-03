describe('query', function () {

  var StoreService, $http, USER_ID = '';

  beforeEach(function (done) {

    IntegrationTestHelper.setup(function (CQRSProvider) {
      CQRSProvider.setUrlFactory(function () {
        return 'http://localhost:3000/data/profile/id/' + USER_ID;
      });

      CQRSProvider.setQueryParser(function (data) {
        return data.response;
      });
    });

    StoreService = IntegrationTestHelper.getCollaborator('StoreService');
    $http = IntegrationTestHelper.getCollaborator('$http');
    $http.get('http://localhost:3000/auth/providerdummy').success(function (data) {
      USER_ID = data.id;
      done();
    });
  });

  it('should fetch profile', function (done) {
    var store = StoreService.createForService();
    store.for('profile').do(function (result) {
      expect(result).not.to.be(undefined);
      expect(result.profile.userId).to.be(USER_ID);
      done();
    });
  });
});
