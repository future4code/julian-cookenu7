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

      BaseDatabase.destroyConnection()
    }

    public async getRecipeById(id: string): Promise<any> {
      const result = await this.getConnection()
        .select("*")
        .from(RecipeDatabase.TABLE_NAME)
        .where({ id });

        BaseDatabase.destroyConnection()

        return result[0];
    }  
}