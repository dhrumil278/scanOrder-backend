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
    console.log('req.params: ', req.params);
    let { foodId, shopId } = req.params;

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
      'select * from pgfood where "shopId" = $1 and "id"= $2 and "isDeleted" = $3',
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

const getAllCategory = async (req, res) => {
  console.log('getAllFood called...');
  try {
    // get the shopId from the middleware
    let userId = req.userId;

    //get shop Id
    let { shopId } = req.body;

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

    let allCategories = await query(
      'select category from pgfood where "shopId" = $1 and "isDeleted" = $2 group by category',
      [shopId, false],
    );

    console.log('allCategories.rows: ', allCategories.rows);
    return res.status(200).json({
      message: 'Food Updated!',
      data: allCategories.rows,
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
    console.log('category: ', category);
    console.log('shopId: ', shopId);

    // userId can be user'sId or shop's Id
    let userId = req.userId;
    console.log('userId: ', userId);

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
      'select a.*, c."quantity" as quantity, case when c."foodId" = a."id" then true else false end as isAddedInCart from (select * from pgaddtocart where "userId"=$1 and "isDeleted"=false) as c right join (select f.*, case when b."foodId" = f."id" then true else false end as isBookmark from (select * from pgbookmark where "userId"=$2) as b right join (select * from pgfood where "shopId" = $3 and "category"= $4 and "isDeleted" = false)as f on b."foodId" = f."id") as a on a."id"=c."foodId"',
      [userId, userId, shopId, category],
    );
    // 'select * from pgfood where "shopId" = $1 and "category"= $2 and "isDeleted" = $3',

    return res.status(200).json({
      message: 'Food!',
      data: getFood.rows,
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

    let findBookmark = await query(
      'select * from pgbookmark where "foodId"=$1 and "userId"=$2',
      [foodId, userId],
    );
    if (findBookmark.rowCount > 0) {
      let removeBookmark = await query(
        'delete from pgbookmark where "foodId"=$1 and "userId"=$2',
        [foodId, userId],
      );
      console.log('removeBookmark: ', removeBookmark);
      return res.status(200).json({
        message: 'Food Unbookmarked!',
      });
    } else {
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
      return res.status(200).json({
        message: 'Food Bookmarked!',
      });
    }
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({
      message: 'Somethig Went Wrong!',
      error: error,
    });
  }
};

const getBookmarkFood = async (req, res) => {
  console.log('getBookmarkFood called....');
  try {
    let { shopId } = req.query;
    let userId = req.userId;

    // validate Data
    let validationResult = await foodValidation({
      shopId: shopId,
      eventCode: Events.GET_BOOKMARK_FOOD,
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
      [shopId],
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

    let getBookMarkFood = await query(
      'select f.*, case when b."foodId" = f."id" then true else false end as isBookmark from (select * from pgbookmark where "userId"=$1) as b join (select * from pgfood where "shopId" = $2 and "isDeleted" = false)as f on b."foodId" = f."id"',
      [userId, shopId],
    );

    return res.status(200).json({
      message: 'Bookmarked Food!',
      data: getBookMarkFood.rows,
    });
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({
      message: 'Somethig Went Wrong!',
      error: error,
    });
  }
};

const addToCartFood = async (req, res) => {
  console.log('addToCartFood called....');
  try {
    let { shopId, foodId, quantity } = req.body;
    let userId = req.userId;

    // validate Data
    let validationResult = await foodValidation({
      shopId: shopId,
      foodId: foodId,
      quantity: quantity,
      eventCode: Events.ADD_TO_CART_FOOD,
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
      [shopId],
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

    let findFoodInAddToCart = await query(
      'select * from pgaddtocart where "foodId"=$1 and "userId"=$2 and "shopId"=$3',
      [foodId, userId, shopId],
    );

    if (findFoodInAddToCart.rowCount > 0 && quantity >= 0) {
      if (quantity === 0) {
        console.log('remove query');
        let removeFood = await query(
          'update pgaddtocart set "isDeleted"=$1,"quantity"=$2 where "userId"=$3 and "foodId" = $4 and "shopId"=$5',
          [true, 0, userId, foodId, shopId],
        );

        if (removeFood.rowCount > 0) {
          return res.status(200).json({
            message: 'Food Removed From Cart',
          });
        }
      } else {
        console.log('add Quanty');
        let updateFoodInCart = await query(
          'update pgaddtocart set "quantity"=$1, "isDeleted"=$2 where "userId"=$3 and "foodId" = $4 and "shopId"=$5',
          [quantity, false, userId, foodId, shopId],
        );
        if (updateFoodInCart.rowCount > 0) {
          return res.status(200).json({
            message: 'Food Updated In Cart',
          });
        }
      }
    } else {
      let insertFood = await query(
        'insert into pgaddtocart ("id","shopId","foodId","userId","quantity","createdAt","updatedAt") values($1,$2,$3,$4,$5,$6,$7)',
        [
          uuidv4(),
          shopId,
          foodId,
          userId,
          quantity,
          moment.utc().valueOf(),
          moment.utc().valueOf(),
        ],
      );
      if (insertFood.rowCount > 0) {
        return res.status(200).json({
          message: 'Food Added In Cart',
        });
      }
    }
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({
      message: 'Somethig Went Wrong!',
      error: error,
    });
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
  getAllCategory,
  getBookmarkFood,
  addToCartFood,
};
