import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { AddressInfo } from "net";
import { IdGenerator } from "./services/IdGenerator";
import { UserDatabase } from "./data/UserDatabase";
import { Authenticator } from "./services/Authenticator";
import { HashManager } from "./services/HashManager";
import moment from 'moment'
import { RecipeDatabase } from "./data/RecipeDatabase";
import { FollowDatabase } from "./data/FollowDatabase";
import { BaseDatabase } from "./data/BaseDatabase";

dotenv.config();

const app = express();

app.use(express.json());

app.post("/signup", async (req: Request, res: Response) => {
  try {

    if (!req.body.email || req.body.email.indexOf("@") === -1) {
      throw new Error("Invalid email");
    }

    if (!req.body.password || req.body.password.length < 6) {
      throw new Error("Invalid password");
    }

    const userData = {
      email: req.body.email,
      name: req.body.name,
      password: req.body.password,
      role: req.body.role
    };

    const hashManager = new HashManager()
    const cipherText = await hashManager.hash(userData.password)

    const idGenerator = new IdGenerator();
    const id = idGenerator.generate();

    const userDb = new UserDatabase();
    await userDb.createUser(id, userData.name, userData.email, cipherText, userData.role);

    const authenticator = new Authenticator();
    const token = authenticator.generateToken({
      id, role: userData.role
    });

    res.status(200).send({
      token,
    });
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }

  await BaseDatabase.destroyConnection()
});

app.post("/login", async (req: Request, res: Response) => {
  try {

    if (!req.body.email || req.body.email.indexOf("@") === -1) {
      throw new Error("Invalid email");
    }

    const userData = {
      email: req.body.email,
      password: req.body.password,
    };

    const userDatabase = new UserDatabase();
    const user = await userDatabase.getUserByEmail(userData.email);

    const hashManager = new HashManager()
    const passwordIsCorrect = await hashManager.compare(userData.password, user.password)

    if (!passwordIsCorrect) {
      throw new Error("Invalid password");
    }

    const authenticator = new Authenticator();
    const token = authenticator.generateToken({
      id: user.id,
      role: user.role
    });

    res.status(200).send({
      token,
    });
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }

  await BaseDatabase.destroyConnection()
});

app.get("/user/profile", async (req: Request, res: Response) => {

  try {

    const authenticator = new Authenticator();
    const tokenData = authenticator.getData(req.headers.authorization as string);

    const userDb = new UserDatabase();

    const user = await userDb.getUserById(tokenData.id);

    res.status(200).send({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }

  await BaseDatabase.destroyConnection()
});

app.post("/recipe", async (req: Request, res: Response) => {
  try {

    const authenticator = new Authenticator();
    const tokenData = authenticator.getData(req.headers.authorization as string);

    if (!req.body.title || !req.body.ingredients || !req.body.preparation_method) {
      throw new Error("Empty field");
    }

    const idGenerator = new IdGenerator()
    const id = idGenerator.generate()

    const today = moment().format("YYYY-MM-DD")

    const recipeData = {
      title: req.body.title,
      ingredients: req.body.ingredients,
      preparation_method: req.body.preparation_method
    }

    const recipeDb = new RecipeDatabase()
    await recipeDb.createRecipe(
      id,
      recipeData.title,
      recipeData.ingredients,
      recipeData.preparation_method,
      today,
      tokenData.id
    )

    res.status(200).send({
      message: "Recipe created"
    })

  } catch (err) {
    res.status(400).send({
      message: err.message
    })
  }

  await BaseDatabase.destroyConnection()
})

app.get("/recipe/:id", async (req: Request, res: Response) => {
  try {

    const authenticator = new Authenticator();
    authenticator.getData(req.headers.authorization as string);

    const recipeDb = new RecipeDatabase()
    const recipe = await recipeDb.getRecipeById(req.params.id)
    const createdAt = moment(recipe.creation_date).format("DD/MM/YYYY")

    res.status(200).send({
      id: recipe.id,
      title: recipe.title,
      ingredients: recipe.ingredients,
      preparation_method: recipe.preparation_method,
      creation_date: createdAt
    })

  } catch (err) {
    res.status(400).send({
      message: err.message
    })
  }

  await BaseDatabase.destroyConnection()
})

app.get("/feed", async (req: Request, res: Response) => {
  try {
    const authenticator = new Authenticator()
    authenticator.getData(req.headers.authorization as string)

    const recipesDb = new RecipeDatabase()
    const recipesFeed = await recipesDb.getRecipes()
    
    const recipes = recipesFeed.map((recipe: any) => {
      recipe.creation_date = moment(recipe.creation_date).format("DD/MM/YYYY")
      return recipe
    })

    res.status(200).send({
      recipes
    })
  } catch (err) {
    res.status(400).send({
      message: err.message
    })
  }

  await BaseDatabase.destroyConnection()
})

app.post("/user/follow", async (req: Request, res: Response) => {
  try {

    const authenticator = new Authenticator()
    const tokenData = authenticator.getData(req.headers.authorization as string)

    if (!req.body.userToFollowId) {
      throw new Error("Empty field")
    }

    const userToFollowId = req.body.userToFollowId

    const userToFollowDb = new UserDatabase()
    const userToFollowIdDb = await userToFollowDb.getUserById(userToFollowId)

    if (!userToFollowIdDb) {
      throw new Error("Invalid Id")
    }

    console.log(tokenData.id)
    console.log(userToFollowId)

    const followDb = new FollowDatabase()
    await followDb.followUser(
      tokenData.id,
      userToFollowId
    )

    res.status(200).send({
      message: "Followed sucessfully"
    })

  } catch (err) {
    res.status(400).send({
      message: err.message
    })
  }

  await BaseDatabase.destroyConnection()
})

app.post("/user/unfollow", async (req: Request, res: Response) => {
  try {
    const authenticator = new Authenticator();
    const tokenData = authenticator.getData(req.headers.authorization as string);
    const followerId = tokenData.id

    const userUnFollowingId = req.body.userToUnfollowId

    const userFollowing = new FollowDatabase()
    await userFollowing.deleteUser(followerId, userUnFollowingId)

    res.status(200).send({
      message: "Unfollowing"
    });

  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }

  await BaseDatabase.destroyConnection()
});

app.get("/user/:id", async (req: Request, res: Response) => {
  try {
    const authenticator = new Authenticator();
    authenticator.getData(req.headers.authorization as string);

    const userDb = new UserDatabase();
    const user = await userDb.getUserById(req.params.id);

    res.status(200).send({
      id: user.id,
      name: user.name,
      email: user.email
    });
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }

  await BaseDatabase.destroyConnection()
});

app.delete("/user/:id", async (req: Request, res: Response) => {
  try {

    const authenticator = new Authenticator()
    const tokenData = authenticator.getData(req.headers.authorization as string)

    if (tokenData.role !== "ADMIN") {
      throw new Error("Apenas administradores podem deletar outro usuário")
    }

    const userDB = new UserDatabase()
    await userDB.deleteUser(req.params.id)

    res.status(200).send({
      message: "Usuário deletado"
    })
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }

  await BaseDatabase.destroyConnection()
});

const server = app.listen(process.env.PORT || 3003, () => {
  if (server) {
    const address = server.address() as AddressInfo;
    console.log(`Server is running in http://localhost:${address.port}`);
  } else {
    console.error(`Failure upon starting server.`);
  }
});