const { getPostgreSQL } = require("./connection");

function identifier(value) {
  if (typeof value !== "string" || !/^[A-Za-z_][A-Za-z0-9_.]*$/.test(value)) {
    throw new TypeError(`Invalid SQL identifier: ${value}`);
  }

  return value
    .split(".")
    .map((part) => `"${part}"`)
    .join(".");
}

function normalizeFields(fields) {
  if (fields.length === 0) return "*";
  const values = Array.isArray(fields[0]) ? fields[0] : fields;
  return values.map(identifier).join(", ");
}

function createQuery(table) {
  const tableName = identifier(table);
  const state = {
    conditions: [],
    values: [],
    fields: [],
    order: null,
    limit: null,
    offset: null,
    operation: "select",
  };

  const addCondition = (column, operator, value) => {
    state.values.push(value);
    state.conditions.push(
      `${identifier(column)} ${operator} $${state.values.length}`,
    );
  };

  const query = {
    select(...fields) {
      state.operation = "select";
      state.fields = fields;
      return query;
    },
    where(column, operator, value) {
      if (arguments.length === 2) {
        value = operator;
        operator = "=";
      }
      addCondition(column, operator, value);
      return query;
    },
    orderBy(column, direction = "asc") {
      const normalizedDirection =
        String(direction).toLowerCase() === "desc" ? "DESC" : "ASC";
      state.order = `${identifier(column)} ${normalizedDirection}`;
      return query;
    },
    limit(value) {
      state.limit = Number.parseInt(value, 10);
      return query;
    },
    offset(value) {
      state.offset = Number.parseInt(value, 10);
      return query;
    },
    insert(data) {
      state.operation = "insert";
      state.data = data;
      return query;
    },
    update(data) {
      state.operation = "update";
      state.data = data;
      return query;
    },
    del() {
      state.operation = "delete";
      return query;
    },
    delete() {
      return query.del();
    },
    count() {
      state.operation = "count";
      return query;
    },
    then(resolve, reject) {
      return execute().then(resolve, reject);
    },
    catch(reject) {
      return execute().catch(reject);
    },
  };

  async function execute() {
    const pool = getPostgreSQL();
    if (!pool) throw new Error("PostgreSQL is not connected");

    let text;
    const values = [...state.values];
    if (state.operation === "insert") {
      const entries = Object.entries(state.data);
      text = `INSERT INTO ${tableName} (${entries.map(([key]) => identifier(key)).join(", ")}) VALUES (${entries
        .map(([, value]) => {
          values.push(value);
          return `$${values.length}`;
        })
        .join(", ")}) RETURNING *`;
    } else if (state.operation === "update") {
      const entries = Object.entries(state.data);
      text = `UPDATE ${tableName} SET ${entries
        .map(([key, value]) => {
          values.push(value);
          return `${identifier(key)} = $${values.length}`;
        })
        .join(", ")}`;
      if (state.conditions.length)
        text += ` WHERE ${state.conditions.join(" AND ")}`;
      text += " RETURNING *";
    } else if (state.operation === "delete") {
      text = `DELETE FROM ${tableName}`;
      if (state.conditions.length)
        text += ` WHERE ${state.conditions.join(" AND ")}`;
    } else if (state.operation === "count") {
      text = `SELECT COUNT(*) FROM ${tableName}`;
      if (state.conditions.length)
        text += ` WHERE ${state.conditions.join(" AND ")}`;
    } else {
      text = `SELECT ${normalizeFields(state.fields)} FROM ${tableName}`;
      if (state.conditions.length)
        text += ` WHERE ${state.conditions.join(" AND ")}`;
      if (state.order) text += ` ORDER BY ${state.order}`;
      if (Number.isInteger(state.limit) && state.limit >= 0)
        text += ` LIMIT ${state.limit}`;
      if (Number.isInteger(state.offset) && state.offset >= 0)
        text += ` OFFSET ${state.offset}`;
    }

    const result = await pool.query(text, values);
    return result.rows;
  }

  return query;
}

module.exports = createQuery;
