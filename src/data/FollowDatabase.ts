import { BaseDatabase } from "./BaseDatabase";

export class FollowDatabase extends BaseDatabase {

  private static TABLE_NAME = "Follow";

  public async followUser(
    follower_id: string,
    following_id: string
  ): Promise<void> {
    await this.getConnection()
      .insert({
        follower_id,
        following_id
      })
      .into(FollowDatabase.TABLE_NAME);

    BaseDatabase.destroyConnection()
  }

  public async getFollowById(id: string): Promise<any> {

    const result = await this.getConnection()
      .select("*")
      .from(FollowDatabase.TABLE_NAME)
      .where({ id });

    BaseDatabase.destroyConnection()
     
    return result[0];
}
    public async deleteUser(id: string): Promise<void> {
      await this.getConnection().raw(`
      DELETE FROM ${FollowDatabase.TABLE_NAME}
      WHERE id = "${id}"
      `)

      BaseDatabase.destroyConnection()
    }
}