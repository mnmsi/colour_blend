const express = require('express')
;
const app = express()
const port = 3000

// Controller
const mainController = require('./controller/index')
const coolController = require('./controller/cool')
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const session = require('express-session');


app.use(expressLayouts)
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
    // set the layout
app.set('layout', './layouts/base')
app.set('view engine', 'ejs');
// enable css and js 
app.set('layout extractScripts', true)
app.set('layout extractStyles', true)

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
app.use(flash());

const router = express.Router();

router.get('', mainController.loadPage);
router.post('/blend_color', mainController.blend_color);

router.get('/cool', coolController.loadPage);
router.post('/cool_blend_color', coolController.blend_color);

app.use(router)


app.listen(port, () => {
    // runOPt()
    // http://localhost:3000/
    console.log('yes you can browse now at http://localhost:' + port);
})