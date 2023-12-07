const {
  fs,
  uuidv4,
  cloudinary,
  Events,
  moment,
  query,
} = require('../../../config/constants');
const { foodValidation } = require('../../../config/validation');

const addFoodItem = async (req, res) => {
  console.log('addFoodItem called...');
  try {
    let { title, description, price, isVeg, category } = req.body;
    let images = [];

    // get the shopId from the middleware
    let shopId = req.userId;

    if (req.files.length < 1) {
      return res.status(400).json({
        message: 'Image not uploaded',
      });
    }

    // validate Data
    let validationResult = await foodValidation({
      title: title,
      description: description,
      price: price,
      isVeg: isVeg,
      category: category,
      eventCode: Events.ADD_FOOD_ITEM,
    });

    if (validationResult.hasError === true) {
      return res.status(400).json({
        message: 'Field Missing',
        error: validationResult.error,
      });
    }

    // find the active user in DB
    let findShop = await query(
      'select * from pgowner where "id"=$1 and "isActive"=true and "isDeleted"=false and "isVerified"=true',
      [shopId],
    );

    if (findShop.rowCount < 1) {
      return res.status(400).json({
        message: 'Shop Not Found!',
      });
    }

    for (let i = 0; i < req.files.length; i++) {
      let url = await cloudinary.uploader.upload(req.files[i].path);
      images.push(url.secure_url);
    }

    if (images.length < 1) {
      await Promise.all(
        req.files.map(async (file) => {
          fs.unlink(file.path, (err) => null);
        }),
      );
      return res.status(400).json({
        message: 'Image not Uploaded!',
      });
    }

    let addFood = await query(
      'insert into pgfood ("id","title","description","price","isVeg","createdAt","updatedAt","shopId","image","category") values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *',
      [
        uuidv4(),
        title,
        description,
        price,
        isVeg,
        moment.utc().valueOf(),
        moment.utc().valueOf(),
        shopId,
        images,
        category,
      ],
    );

    await Promise.all(
      req.files.map(async (file) => {
        await fs.unlink(file.path, (err) => null);
      }),
    );
    return res.status(200).json({
      message: 'Food added!',
      data: addFood.rows[0],
    });
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({
      message: 'Somethig Went Wrong!',
      error: error,
    });
  }
};

const updateFood = async (req, res) => {
  console.log('updateFood called...');
  try {
    let { title, description, price, isVeg, category, foodId } = req.body;

    // get the shopId from the middleware
    let shopId = req.userId;

    // validate Data
    let validationResult = await foodValidation({
      title: title,
      description: description,
      price: price,
      isVeg: isVeg,
      category: category,
      foodId: foodId,
      eventCode: Events.UPDATE_FOOD,
    });

    if (validationResult.hasError === true) {
      return res.status(400).json({
        message: 'Field Missing',
        error: validationResult.error,
      });
    }

    // find the active user in DB
    let findShop = await query(
      'select * from pgowner where "id"=$1 and "isActive"=true and "isDeleted"=false and "isVerified"=true',
      [shopId],
    );

    if (findShop.rowCount < 1) {
      return res.status(400).json({
        message: 'Shop Not Found!',
      });
    }

    let updateFood = await query(
      'update pgfood set "title"=$1,"description"=$2,"price"=$3,"isVeg"=$4,"category"=$5,"updatedAt"=$6 where "id" = $7 returning *',
      [
        title,
        description,
        price,
        isVeg,
        category,
        moment.utc().valueOf(),
        foodId,
      ],
    );

    return res.status(200).json({
      message: 'Food Updated!',
      data: updateFood.rows[0],
    });
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({
      message: 'Somethig Went Wrong!',
      error: error,
    });
  }
};

const deleteFood = async (req, res) => {
  console.log('deleteFood called...');
  try {
    let { foodId } = req.body;

    // get the shopId from the middleware
    let shopId = req.userId;

    // validate Data
    let validationResult = await foodValidation({
      foodId: foodId,
      eventCode: Events.DELETE_FOOD,
    });

    if (validationResult.hasError === true) {
      return res.status(400).json({
        message: 'Field Missing',
        error: validationResult.error,
      });
    }

    // find the active user in DB
    let findShop = await query(
      'select * from pgowner where "id"=$1 and "isActive"=true and "isDeleted"=false and "isVerified"=true',
      [shopId],
    );

    if (findShop.rowCount < 1) {
      return res.status(400).json({
        message: 'Shop Not Found!',
      });
    }

    let updateFood = await query(
      'update pgfood set "isDeleted"=$1,"updatedAt"=$2 where "id" = $3 and "isDeleted" = $4 returning *',
      [true, moment.utc().valueOf(), foodId, false],
    );

    if (updateFood.rows < 1) {
      return res.status(400).json({
        message: 'Food Item not Found!',
      });
    }
    return res.status(200).json({
      message: 'Food Deleted!',
      data: updateFood.rows[0],
    });
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({
      message: 'Somethig Went Wrong!',
      error: error,
    });
  }
};

const getAllFood = async (req, res) => {
  console.log('getAllFood called...');
  try {
    // get the shopId from the middleware
    let shopId = req.userId;

    // find the active user in DB
    let findShop = await query(
      'select * from pgowner where "id"=$1 and "isActive"=true and "isDeleted"=false and "isVerified"=true',
      [shopId],
    );

    if (findShop.rowCount < 1) {
      return res.status(400).json({
        message: 'Shop Not Found!',
      });
    }

    let allFoods = await query(
      'select * from pgfood where "shopId" = $1 and "isDeleted" = $2',
      [shopId, false],
    );

    return res.status(200).json({
      message: 'Food Updated!',
      data: allFoods.rows,
    });
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({
      message: 'Somethig Went Wrong!',
      error: error,
    });
  }
};

const getOneFood = async (req, res) => {
  console.log('getOneFood called...');
  try {
    let { foodId } = req.body;
    // get the shopId from the middleware
    let shopId = req.userId;

    // validate Data
    let validationResult = await foodValidation({
      foodId: foodId,
      eventCode: Events.GET_ONE_FOOD,
    });

    if (validationResult.hasError === true) {
      return res.status(400).json({
        message: 'Field Missing',
        error: validationResult.error,
      });
    }

    // find the active user in DB
    let findShop = await query(
      'select * from pgowner where "id"=$1 and "isActive"=true and "isDeleted"=false and "isVerified"=true',
      [shopId],
    );

    if (findShop.rowCount < 1) {
      return res.status(400).json({
        message: 'Shop Not Found!',
      });
    }

    let oneFood = await query(
      'select * from pgfood where "shopId" = $1 and "id"= $2" and isDeleted" = $3',
      [shopId, foodId, false],
    );

    return res.status(200).json({
      message: 'Food!',
      data: oneFood.rows[0],
    });
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({
      message: 'Somethig Went Wrong!',
      error: error,
    });
  }
};

const getFoodByCategory = async (req, res) => {
  console.log('getFoodByCategory called...');
  try {
    let { category, shopId } = req.query;

    // userId can be user'sId or shop's Id
    let userId = req.userId;

    // validate Data
    let validationResult = await foodValidation({
      category: category,
      shopId: shopId,
      eventCode: Events.GET_FOOD_BY_CATEGORY,
    });

    if (validationResult.hasError === true) {
      return res.status(400).json({
        message: 'Field Missing',
        error: validationResult.error,
      });
    }

    // find the active shop in DB
    let findShop = await query(
      'select * from pgowner where "id"=$1 and "isActive"=true and "isDeleted"=false and "isVerified"=true',
      [userId],
    );

    // find the active user in DB
    let findUser = await query(
      'select * from pguser where "id"=$1 and "isActive"=true and "isDeleted"=false and "isVerified"=true',
      [userId],
    );

    if (findShop.rowCount < 1 && findUser.rowCount < 1) {
      return res.status(400).json({
        message: 'Shop or User Not Found!',
      });
    }

    let getFood = await query(
      'select * from pgfood where "shopId" = $1 and "category"= $2 and "isDeleted" = $3',
      [shopId, category, false],
    );

    return res.status(200).json({
      message: 'Food!',
      data: getFood.rows[0],
    });
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({
      message: 'Somethig Went Wrong!',
      error: error,
    });
  }
};

const bookmarkFood = async (req, res) => {
  console.log('bookmarkFood called...');
  try {
    let { foodId } = req.query;

    // userId can be user'sId or shop's Id
    let userId = req.userId;

    // validate Data
    let validationResult = await foodValidation({
      foodId: foodId,
      eventCode: Events.BOOKMARK_FOOD,
    });

    if (validationResult.hasError === true) {
      return res.status(400).json({
        message: 'Field Missing',
        error: validationResult.error,
      });
    }

    // find the active user in DB
    let findUser = await query(
      'select * from pguser where "id"=$1 and "isActive"=true and "isDeleted"=false and "isVerified"=true',
      [userId],
    );

    if (findUser.rowCount < 1) {
      return res.status(400).json({
        message: 'User Not Found!',
      });
    }

    let bookmark = await query(
      'insert into pgbookmark ("id","userId","foodId","createdAt","updatedAt") values($1,$2,$3,$4,$5) returning *',
      [
        uuidv4(),
        userId,
        foodId,
        moment.utc().valueOf(),
        moment.utc().valueOf(),
      ],
    );

    return res.status(200).josn({
      message: 'Food Bookmarked!',
      data: bookmark.rows[0],
    });
  } catch (error) {
    console.log('error: ', error);
  }
};

module.exports = {
  addFoodItem,
  updateFood,
  deleteFood,
  getAllFood,
  getOneFood,
  getFoodByCategory,
  bookmarkFood,
};
