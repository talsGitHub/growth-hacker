

module.exports =  async(req, res) => {

	res.render('messenger', {
        user: req.user
	})

}