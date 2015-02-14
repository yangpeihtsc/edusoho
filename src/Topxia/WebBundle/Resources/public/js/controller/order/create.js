define(function(require, exports, module) {

	require('placeholder');
	
	var Validator = require('bootstrap.validator');
	require('common/validator-rules').inject(Validator);

	exports.run = function() {
		var cashRateElement = $('[role="cash-rate"]');
		var cashRate = 1;
		if($('[role="cash-rate"]').val() != ""){
			cashRate = $('[role="cash-rate"]').val();
			cashRate = parseInt(cashRate*100)/100;
		}
		var validator = new Validator({
            element: '#order-create-form',
            triggerType: 'change',
            //autoSubmit: false,
            onFormValidated: function(error){
                if (error) {
                    return false;
                }
                $('#order-create-btn').button('submiting').addClass('disabled');
            }
        });

		function divition(x,y) {
			return Math.round(Math.round(x*1000)/Math.round(y*1000)*1000)/1000;
		}

		function multiple(x, y){
			return Math.round(Math.round(x*100) * Math.round(y*100))/10000;
		}

		function subtract(x,y) {
			return Math.round(Math.round(x*1000)-Math.round(y*1000))/1000;
		}

		function moneyFormatFloor(value) {
	        // 转化成字符串
	        value = value + '';　
	        value = parseInt(Math.round(value * 1000));
	        // 抹去最后１位
	        value = parseInt(value/10) * 10 / 1000;
	        return value.toFixed(2);
	    }

		function moneyFormatCeil(value) {
	        value = value + '';
	        value = parseFloat(value).toFixed(3);
	        var length = value.length;
	        if (value.substr(length-1, 1) === '0') {
	            return moneyFormatFloor(value);
	        }
	        return moneyFormatFloor(parseFloat(value) + 0.01);
	    }

		function afterCouponPay(){
			var totalPrice = parseFloat($('[role="total-price"]').text());
			var couponTotalPrice = $('[role="coupon-price"]').find("[role='price']").text();
			if($.trim(couponTotalPrice) == "" || isNaN(couponTotalPrice)){
				couponTotalPrice = 0;
			}
			if(totalPrice < couponTotalPrice){
 				couponTotalPrice = totalPrice;
 			}
			totalPrice = subtract(totalPrice, couponTotalPrice);
			return totalPrice;
		}

		function afterCoinPay(coinNum){
			var accountCash = $('[role="accountCash"]').text();
			if(accountCash == "" || isNaN(accountCash) || parseFloat(accountCash) == 0) {
				return;
			}
			var coin = Math.round(accountCash*1000)>Math.round(coinNum*1000) ? coinNum : accountCash;

			if(cashRateElement.data("priceType") == "RMB"){
				var totalPrice = parseFloat($('[role="total-price"]').text());
				var cashDiscount = Math.round(moneyFormatFloor(divition(coin, cashRate))*100)/100;
				if(totalPrice < cashDiscount){
	 				cashDiscount = totalPrice;
	 			}
				$('[role="cash-discount"]').text(moneyFormatFloor(cashDiscount));
			}else{
				$('[role="cash-discount"]').text(moneyFormatFloor(coin));
			}
			$('[role="coinNum"]').val(coin);
			
		}

		function conculatePrice(){
			var totalPrice = afterCouponPay();
			if(totalPrice <= 0){
				totalPrice = 0;
				coinPriceZero();
				$('[role="pay-coin"]').text("0.00");
				$('[role="pay-rmb"]').text("0.00");
			} else {
				var coinNum = 0;
				if(cashRateElement.data("priceType") == "RMB") {
					coinNum = multiple(totalPrice, cashRate);
					coinNum = moneyFormatCeil(coinNum);
				} else {
					coinNum = totalPrice;
				}
				var coinNumPay = $('[role="coinNum"]').val();
				if(coinNumPay && $('[name="payPassword"]').length>0){
					if(coinNum <= parseFloat(coinNumPay)){
						coinNumPay = coinNum;
					}
					afterCoinPay(coinNumPay);
					$('[role="coinNum"]').val(coinNumPay);
					var cashDiscount = $('[role="cash-discount"]').text();
					totalPrice = subtract(totalPrice, cashDiscount);
				} else {
					$('[role="coinNum"]').val(0);
					$('[role="cash-discount"]').text("0.00");
				}
			}

			shouldPay(totalPrice);
		}

		function shouldPay(totalPrice){
			totalPrice = Math.round(totalPrice*1000)/1000;
			if(cashRateElement.data("priceType") == "RMB") {
				totalPrice = moneyFormatCeil(totalPrice);
				$('[role="pay-rmb"]').text(totalPrice);
				$('input[name="shouldPayMoney"]').val(totalPrice);
			} else {
				var payRmb = moneyFormatCeil(divition(totalPrice, cashRate));
				var shouldPayMoney = Math.round(payRmb*100)/100;
				$('[role="pay-coin"]').text(totalPrice);
				$('[role="pay-rmb"]').text(shouldPayMoney);
				$('input[name="shouldPayMoney"]').val(shouldPayMoney);
			}
		}

		function coinPriceZero(){
			$('[role="coinNum"]').val(0);
			$('[role="cash-discount"]').text("0.00");
			$(".pay-password div[role='password-input']").hide();
			validator.removeItem('[name="payPassword"]');
		}

		function showPayPassword(){
			$(".pay-password div[role='password-input']").show();
			validator.addItem({
				element: '[name="payPassword"]',
				required: true,
				display: '支付密码',
    			rule: 'remote'
			});
		}

		$('[role="coinNum"]').blur(function(e){
			var coinNum = $(this).val();
			coinNum = Math.round(coinNum*100)/100;
			$(this).val(coinNum);
			if(isNaN(coinNum) || coinNum<=0){
				$(this).val("0.00");
				coinPriceZero();
			} else {
				showPayPassword();
			}
			conculatePrice();
		});

		$("#coupon-code-btn").click(function(e){
			$('[role="coupon-code"]').show().focus();
			$('[role="no-use-coupon-code"]').hide();
			$('[role="cancel-coupon"]').show();
			$('[role="code-notify"]').show();
			$(this).hide();
		})

		$('[role="cancel-coupon"]').click(function(e){
			$('[role="coupon-code"]').hide();
			$('[role="no-use-coupon-code"]').show();
			$("#coupon-code-btn").show();
			$('[role="code-notify"]').hide();
			$('[role="coupon-price"]').find("[role='price']").text("0.00");
			$('[role="code-notify"]').text("");
			$('[role="coupon-code"]').val("");
			$(this).hide();
			conculatePrice();
		});

		$('[role="coupon-code"]').blur(function(e){
			var data={};
			data.code = $(this).val();
			if(data.code == ""){
				return;
			}
			data.targetType = $(this).data("targetType");
			// data.targetType = "course";
			data.targetId = $(this).data("targetId");
			data.amount = $(this).data("amount");
			
			$.post('/'+data.targetType+'/'+data.targetId+'/coupon/check', data, function(data){
				if(data.useable == "no") {
					$('[role="code-notify"]').css("color","red").text(data.message);
				} else if(data.useable == "yes"){
					$('[role="code-notify"]').css("color","green").text("优惠码可用");
					$('[role="coupon-price"]').find("[role='price']").text(moneyFormatFloor(data.decreaseAmount));
				}
				conculatePrice();
			})
		})

 		var totalPrice = parseFloat($('[role="total-price"]').text());
 		if($('[role="coinNum"]').length>0) {
 			var coinNum = $('[role="coinNum"]').val();
 			if(isNaN(coinNum) || coinNum<=0){
				$(this).val("0.00");
				coinPriceZero();
			} else {
				showPayPassword();
			}
			if(cashRateElement.data("priceType") == "RMB") {
	 			var discount = divition(coinNum, cashRate);
	 			if(totalPrice<discount){
	 				discount = totalPrice;
	 			}
	 			$('[role="cash-discount"]').text(moneyFormatFloor(discount));
	 			totalPrice = subtract(totalPrice, discount);
 			} else {
 				$('[role="cash-discount"]').text(moneyFormatFloor(coinNum));
 				totalPrice = subtract(totalPrice, coinNum);
 			}
 		} else {
 			$('[role="cash-discount"]').text("0.00");
 		}
 		shouldPay(totalPrice);
	
 		$('#order-create-btn').click(function(){
 			var coinToPay = $('#coinPayAmount').val();
 			if ((coinToPay.length > 0)&&(!isNaN(coinToPay))&&(coinToPay > 0)){
 				$("#js-order-create-sms-btn").trigger("click");
 				return false;
 			}
 			return true;
 		});
	}
});