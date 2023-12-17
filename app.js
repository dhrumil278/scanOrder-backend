const { cors, express, corsOptions } = require('./config/constants');

// create a  app
const app = express();

// config middleweres
app.use(cors({
    origin: '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// Recuiring Routes
// Users
const usersAuth = require('./routes/user/userAuthRoutes');
const usersRoute = require('./routes/user/userRoutes');

// Owners
const ownerAuth = require('./routes/owner/ownerAuthRoutes');
const ownerRoute = require('./routes/owner/ownerRoutes');

// Foods
const foodRoute = require('./routes/food/foodRoutes');

// Default Routes
// Users
app.use('/user/auth', usersAuth);
app.use('/user', usersRoute);

// Owner
app.use('/owner/auth', ownerAuth);
app.use('/owner', ownerRoute);

// Owner
app.use('/food', foodRoute);

// create a port
const port = process.env.PORT || 8080;

// Listen App
app.listen(port, () => {
  console.log(`Server Running on Post no : ${port}`);
});
