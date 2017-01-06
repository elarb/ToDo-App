/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
    res.cookie('monster', 'nom nom');
    res.render('home', {
        title: 'Home'
    });
};


