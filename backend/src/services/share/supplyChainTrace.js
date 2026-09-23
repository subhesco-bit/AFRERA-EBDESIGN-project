/**
 * Supply Chain Trace - Multi-Hop Product Traceability
 * Track product through every hop: farm → aggregator → processor → distributor → retailer
 */

'use strict';

class SupplyChainTrace {
  constructor() {
    this.traces = new Map();
  }

  recordHop(hop) {
    const {productId, hopNumber, handler, action, quantity, timestamp, nextHandler} = hop;

    if (!this.traces.has(productId)) {
      this.traces.set(productId, {
        productId,
        hops: [],
        totalCost: 0,
        totalMargin: 0,
      });
    }

    const trace = this.traces.get(productId);
    const hopRecord = {
      hop_number: hopNumber,
      handler: handler,
      action,
      quantity,
      timestamp: timestamp || new Date(),
      next_handler: nextHandler,
      margin_percent: hop.margin_percent || 0,
      delay_days: 0,
    };

    trace.hops.push(hopRecord);
    trace.totalMargin += (hop.margin_percent || 0);

    return hopRecord;
  }

  getChain(productId) {
    const trace = this.traces.get(productId);
    if (!trace) {
      return {found: false, productId};
    }

    const chain = trace.hops.map((hop, idx) => {
      const nextHop = trace.hops[idx + 1];
      const delayDays = nextHop ?
        Math.floor((new Date(nextHop.timestamp) - new Date(hop.timestamp)) / (24*60*60*1000)) : 0;

      return {
        ...hop,
        delay_days: delayDays,
      };
    });

    return {
      found: true,
      productId,
      chain,
      hops_count: chain.length,
      total_margin: Number(trace.totalMargin.toFixed(2)),
      transparency_score: this._calculateTransparency(chain),
      advisory: true,
    };
  }

  _calculateTransparency(chain) {
    let score = 100;
    score -= Math.min(chain.length * 5, 30);
    const avgMargin = chain.reduce((sum, h) => sum + h.margin_percent, 0) / chain.length;
    if (avgMargin > 50) score -= 20;
    return Math.max(score, 0);
  }

  getHopDetails(productId, hopNumber) {
    const trace = this.traces.get(productId);
    if (!trace) return null;

    const hop = trace.hops[hopNumber - 1];
    if (!hop) return null;

    const nextHop = trace.hops[hopNumber];
    const prevHop = trace.hops[hopNumber - 2];

    return {
      hop_number: hopNumber,
      ...hop,
      previous_handler: prevHop ? prevHop.handler : null,
      delay_from_previous: prevHop ?
        Math.floor((new Date(hop.timestamp) - new Date(prevHop.timestamp)) / (24*60*60*1000)) : null,
      delay_to_next: nextHop ?
        Math.floor((new Date(nextHop.timestamp) - new Date(hop.timestamp)) / (24*60*60*1000)) : null,
    };
  }

  calculateCostBreakdown(productId) {
    const trace = this.traces.get(productId);
    if (!trace) return null;

    const breakdown = trace.hops.map((hop, idx) => {
      const quantity = hop.quantity;
      const costAddedPercent = hop.margin_percent || 0;

      return {
        hop: hop.hop_number,
        handler_name: hop.handler.name || hop.handler.id,
        action: hop.action,
        margin_percent: costAddedPercent,
        quantity_at_hop: quantity,
        cumulative_margin: trace.hops.slice(0, idx + 1).reduce((sum, h) => sum + (h.margin_percent || 0), 0),
      };
    });

    return {
      productId,
      breakdown,
      final_cumulative_margin: trace.totalMargin,
      advisory: true,
      basis: 'Supply chain margin tracking across all hops',
    };
  }

  getAllTraces(limit = 100) {
    return {
      advisory: true,
      traces: Array.from(this.traces.values()).slice(-limit),
      total_products_traced: this.traces.size,
    };
  }
}

module.exports = { SupplyChainTrace };
