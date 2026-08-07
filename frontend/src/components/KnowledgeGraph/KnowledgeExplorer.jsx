import React, { useState, useEffect } from 'react';
import { knowledgeGraphAPI } from '../../services/api';

/**
 * Knowledge Explorer Component
 * Interactive knowledge graph visualization and exploration
 *
 * FE-02 note: not resolved here. This is a search/explore tool — every fetch
 * is driven by a search term or node click the user just made, not a fixed
 * dataset a parent page could hand down as props. FE-01 (routing through
 * api.js) is fixed below.
 */
const KnowledgeExplorer = ({ initialNodeId = null }) => {
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [relatedNodes, setRelatedNodes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialNodeId) {
      loadNode(initialNodeId);
    }
  }, [initialNodeId]);

  const loadNode = async (nodeId) => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch node details
      setSelectedNode({ id: nodeId, name: 'Sample Node', type: 'product' });
      
      // Fetch related nodes
      const response = await knowledgeGraphAPI.getRelatedNodes(nodeId);
      setRelatedNodes(response.data);
    } catch (err) {
      console.error('Failed to load node:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await knowledgeGraphAPI.searchNodes(searchQuery);
      setSearchResults(response.data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getNodeColor = (nodeType) => {
    const colors = {
      product: 'bg-blue-500',
      farmer: 'bg-green-500',
      location: 'bg-purple-500',
      nutrient: 'bg-orange-500',
      disease: 'bg-red-500',
      practice: 'bg-teal-500'
    };
    return colors[nodeType] || 'bg-gray-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">Knowledge Graph Explorer</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="w-3 h-3 bg-blue-500 rounded-full"></span> Product
          <span className="w-3 h-3 bg-green-500 rounded-full"></span> Farmer
          <span className="w-3 h-3 bg-purple-500 rounded-full"></span> Location
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input aria-label="Text"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search knowledge graph..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Search
          </button>
        </div>
      </form>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-3">Search Results</p>
          <div className="space-y-2">
            {searchResults.map((node) => (
              <button
                key={node.id}
                onClick={() => loadNode(node.id)}
                className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${getNodeColor(node.node_type)} rounded-full`}></div>
                  <div>
                    <p className="font-medium text-gray-800">{node.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{node.node_type}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Node */}
      {selectedNode && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 ${getNodeColor(selectedNode.type)} rounded-full flex items-center justify-center text-white font-bold`}>
              {selectedNode.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{selectedNode.name}</p>
              <p className="text-sm text-gray-600 capitalize">{selectedNode.type}</p>
            </div>
          </div>
          {selectedNode.description && (
            <p className="text-sm text-gray-700">{selectedNode.description}</p>
          )}
        </div>
      )}

      {/* Related Nodes */}
      {relatedNodes.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Related Entities</p>
          <div className="grid grid-cols-2 gap-3">
            {relatedNodes.map((node, index) => (
              <button
                key={index}
                onClick={() => loadNode(node.id)}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-4 h-4 ${getNodeColor(node.type)} rounded-full`}></div>
                  <p className="font-medium text-gray-800 text-sm truncate">{node.name}</p>
                </div>
                <p className="text-xs text-gray-500 capitalize">{node.type}</p>
                {node.relationship && (
                  <p className="text-xs text-blue-600 mt-1">{node.relationship}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedNode && searchResults.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          <p>Search for entities or select a node to explore the knowledge graph</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeExplorer;
