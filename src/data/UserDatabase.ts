import knex from "knex";
import { BaseDatabase } from "./BaseDatabase";
import { USER_ROLES } from '../services/Authenticator'

export class UserDatabase extends BaseDatabase {

  private static TABLE_NAME = "UserCook";

  public async createUser(
    id: string,
    name: string,
    email: string,
    password: string,
    role: USER_ROLES
  ): Promise<void> {
    await this.getConnection()
      .insert({
        id,
        name,
        email,
        password,
        role
      })
      .into(UserDatabase.TABLE_NAME);

    BaseDatabase.destroyConnection()
  }

  public async getUserByEmail(email: string): Promise<any> {
    const result = await this.getConnection()
      .select("*")
      .from(UserDatabase.TABLE_NAME)
      .where({ email });

    BaseDatabase.destroyConnection()
     return result[0];
  }

  public async getUserById(id: string): Promise<any> {
    const result = await this.getConnection()
      .select("*")
      .from(UserDatabase.TABLE_NAME)
      .where({ id });

    BaseDatabase.destroyConnection()
    
    return result[0];
  }

  public async deleteUser(id: string): Promise<void> {
    await this.getConnection().raw(`
    DELETE FROM ${UserDatabase.TABLE_NAME}
    WHERE id = "${id}"
    `)

    BaseDatabase.destroyConnection()
  }
}