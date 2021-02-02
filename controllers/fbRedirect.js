const axios = require('axios');
const accessTokens = new Set();

module.exports =  async(req, res) => {

    try {
        const authCode = req.query.code;
    
        // Build up the URL for the API request. `client_id`, `client_secret`,
        // `code`, **and** `redirect_uri` are all required. And `redirect_uri`
        // must match the `redirect_uri` in the dialog URL from Route 1.
        const accessTokenUrl = 'https://graph.facebook.com/v6.0/oauth/access_token?' +
          `client_id=#######` +
          `client_secret=########` +
          `redirect_uri=${encodeURIComponent('https://localhost:5000/msg')}&` +
          `code=${encodeURIComponent(authCode)}`;
    
        // Make an API request to exchange `authCode` for an access token
        const accessToken = await axios.get(accessTokenUrl).then(res => res.data['access_token']);
        // Store the token in memory for now. Later we'll store it in the database.
        console.log('Access token is', accessToken);
        accessTokens.add(accessToken);
    
        res.redirect(`/me?accessToken=${encodeURIComponent(accessToken)}`);
      } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.response.data || err.message });
      }

}