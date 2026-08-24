const { GraphQLObjectType, GraphQLSchema, GraphQLString } = require('graphql');

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    health: {
      type: GraphQLString,
      resolve: () => 'ok'
    }
  }
});

module.exports = new GraphQLSchema({ query: QueryType });
