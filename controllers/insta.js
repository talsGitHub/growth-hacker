const request = require('request');

module.exports =  async(req, res) => {

    request({
        "uri": "https://api.instagram.com/oauth/authorize",
        "qs": { "client_id": '399729431157388', "redirect_uri": 'https://ghacker.herokuapp.com/insta', "scope": 'user_profile,user_media', "response_type": 'code' },
        "method": "POST",
        "json": ""
      }, (err, res, body) => {
        if (!err) {
          console.log('message sent!')
        } else {
          console.error("Unable to send message:" + err);
        }
      });

	res.render('insta', {

	})

}