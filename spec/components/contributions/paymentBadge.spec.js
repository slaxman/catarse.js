describe('PaymentBadge component', function() {
  describe('view', function() {
    var getOutput = function(payment_method){
      var contribution = ContributionDetailMockery(1, {payment_method: payment_method}),
          view = adminApp.PaymentBadge.view({},{contribution: contribution[0]});
      return mq(view);
    };

    it('should return an HTML element describing a boleto when payment_method is boleto', function() {
      expect(getOutput('BoletoBancario').has('#boleto-detail')).toBeTrue();
    });
    it('should return an HTML element describing a credit card when payment_method is credit card', function() {
      expect(getOutput('CartaoDeCredito').has('#creditcard-detail')).toBeTrue();
    });
  });
});