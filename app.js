const { cors, express, corsOptions } = require('./config/constants');

// create a  app
const app = express();

// config middleweres
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// Recuiring Routes
// Users
const usersAuth = require('./routes/user/userAuthRoutes');
const usersRoute = require('./routes/user/userRoutes');

// Default Routes
// Users
app.use('/user/auth', usersAuth);
app.use('/user', usersRoute);

// create a port
const port = process.env.PORT || 8080;

// Listen App
app.listen(port, () => {
  console.log(`Server Running on Post no : ${port}`);
});
