import { BaseDatabase } from "./BaseDatabase";
import moment from "moment";


export class RecipeDatabase extends BaseDatabase {
  private static TABLE_NAME = "Recipe";

  public async createRecipe(
    id: string,
    title: string,
    ingredients: string,
    preparation_method: string,
    creation_date: string,
    creator_user_id: string,
  ): Promise<void> {
    await this.getConnection()
      .insert({
        id,
        title,
        ingredients,
        preparation_method,
        creation_date,
        creator_user_id
      })
      .into(RecipeDatabase.TABLE_NAME);

  }

  public async getRecipeById(id: string): Promise<any> {
    const result = await this.getConnection()
      .select("*")
      .from(RecipeDatabase.TABLE_NAME)
      .where({ id });

    return result[0];
  }

  public async getRecipes(): Promise<any> {
    const result = await this.getConnection().raw(`
      SELECT r.id, r.title, r.ingredients, r.preparation_method, r.creation_date, r.creator_user_id, name
      FROM ${RecipeDatabase.TABLE_NAME} r 
      LEFT JOIN UserCook ON UserCook.id = r.creator_user_id;
      `)

    return result[0]
  }
}