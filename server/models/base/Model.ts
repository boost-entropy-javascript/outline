/* eslint-disable @typescript-eslint/ban-types */
import isEqual from "fast-deep-equal";
import isArray from "lodash/isArray";
import isObject from "lodash/isObject";
import pick from "lodash/pick";
import { FindOptions, NonAttribute } from "sequelize";
import { Model as SequelizeModel } from "sequelize-typescript";
import { Replace } from "@server/types";

class Model<
  TModelAttributes extends {} = any,
  TCreationAttributes extends {} = TModelAttributes
> extends SequelizeModel<TModelAttributes, TCreationAttributes> {
  /**
   * Find all models in batches, calling the callback function for each batch.
   *
   * @param query The query options.
   * @param callback The function to call for each batch of results
   */
  static async findAllInBatches<T extends Model>(
    query: Replace<FindOptions<T>, "limit", "batchLimit">,
    callback: (results: Array<T>, query: FindOptions<T>) => Promise<void>
  ) {
    const mappedQuery = {
      ...query,
      offset: query.offset ?? 0,
      limit: query.batchLimit ?? 10,
    };

    let results;

    do {
      // @ts-expect-error this T
      results = await this.findAll<T>(mappedQuery);
      await callback(results, mappedQuery);
      mappedQuery.offset += mappedQuery.limit;
    } while (results.length >= mappedQuery.limit);
  }

  /**
   * Returns the attributes that have changed since the last save and their previous values.
   *
   * @returns An object with `attributes` and `previousAttributes` keys.
   */
  public get changeset(): NonAttribute<{
    attributes: Partial<TModelAttributes>;
    previous: Partial<TModelAttributes>;
  }> {
    const changes = this.changed() as Array<keyof TModelAttributes> | false;
    const attributes: Partial<TModelAttributes> = {};
    const previousAttributes: Partial<TModelAttributes> = {};

    if (!changes) {
      return {
        attributes,
        previous: previousAttributes,
      };
    }

    for (const change of changes) {
      const previous = this.previous(change);
      const current = this.getDataValue(change);

      if (
        isObject(previous) &&
        isObject(current) &&
        !isArray(previous) &&
        !isArray(current)
      ) {
        const difference = Object.keys(previous)
          .concat(Object.keys(current))
          // @ts-expect-error TODO
          .filter((key) => !isEqual(previous[key], current[key]));

        previousAttributes[change] = pick(
          previous,
          difference
        ) as TModelAttributes[keyof TModelAttributes];
        attributes[change] = pick(
          current,
          difference
        ) as TModelAttributes[keyof TModelAttributes];
      } else {
        previousAttributes[change] = previous;
        attributes[change] = current;
      }
    }

    return {
      attributes,
      previous: previousAttributes,
    };
  }
}

export default Model;
