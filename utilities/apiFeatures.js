class APIFeatures {
  #query;
  #options;
  #table;
  constructor(table, options, attributes) {
    this.#query = `select ${attributes || "*"} from ${table}`;
    this.#options = options;
    this.#table = table;
  }

  join(joinedTable, localField, forignField) {
    this.#query += ` Join ${joinedTable} ON ${
      this.#table
    }.${localField}=${joinedTable}.${forignField}`;
    return this;
  }

  filter(filterObject) {
    this.#query += " where ";
    Object.keys(filterObject).forEach((e) => {
      this.#query += `${e} = '${filterObject[e]}' `;
    });
    return this;
  }

  paginate() {
    const page = +this.#options.page || 1;
    const limit = +this.#options.limit || 100;
    const skip = (page - 1) * limit;
    this.#query = `${this.#query} LIMIT ${limit} OFFSET ${skip}`;
    return this;
  }
  get query() {
    return this.#query;
  }
}

module.exports = APIFeatures;
