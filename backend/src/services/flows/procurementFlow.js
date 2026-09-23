/**
 * Procurement Flow - RFQ to Payment
 *
 * Steps:
 * 1. Create RFQ (Request for Quotation)
 * 2. Invite Suppliers
 * 3. Collect Bids
 * 4. Analyze Bids
 * 5. Award PO (Purchase Order)
 * 6. Track Delivery
 * 7. Receive Goods
 * 8. Process Invoice
 * 9. Authorize Payment
 * 10. Settle Payment
 */

'use strict';

const procurementFlowDefinition = {
  id: 'PROCUREMENT',
  name: 'Procurement Flow',
  description: 'RFQ to Payment workflow for supplier engagement',

  steps: [
    {
      id: 'create_rfq',
      name: 'Create RFQ',
      type: 'create_rfq',
      config: {
        required_fields: ['items', 'quantity', 'deliveryDate', 'budget'],
      },
      compensation: {
        type: 'cancel_rfq',
        config: {},
      },
    },
    {
      id: 'invite_suppliers',
      name: 'Invite Suppliers',
      type: 'send_notifications',
      config: {
        template: 'rfq_invite',
        channels: ['email', 'sms'],
      },
      compensation: null,
    },
    {
      id: 'collect_bids',
      name: 'Collect Bids',
      type: 'wait_for_bids',
      config: {
        timeout_hours: 48,
        min_bids: 2,
      },
      compensation: null,
    },
    {
      id: 'analyze_bids',
      name: 'Analyze Bids',
      type: 'evaluate_bids',
      config: {
        criteria: ['price', 'quality', 'delivery', 'supplier_rating'],
        weights: {price: 0.40, quality: 0.35, delivery: 0.15, supplier_rating: 0.10},
      },
      compensation: null,
    },
    {
      id: 'award_po',
      name: 'Award PO',
      type: 'create_po',
      config: {
        auto_approve: true,
        send_notification: true,
      },
      compensation: {
        type: 'cancel_po',
        config: {},
      },
    },
    {
      id: 'track_delivery',
      name: 'Track Delivery',
      type: 'track_shipment',
      config: {
        tracking_intervals: 24, // hours
        max_wait_days: 10,
      },
      compensation: null,
    },
    {
      id: 'receive_goods',
      name: 'Receive Goods',
      type: 'quality_check',
      config: {
        inspection_required: true,
        accept_partial: true,
      },
      compensation: {
        type: 'create_return',
        config: {reason: 'Quality issue'},
      },
    },
    {
      id: 'process_invoice',
      name: 'Process Invoice',
      type: 'match_invoice',
      config: {
        three_way_match: true, // PO-Receipt-Invoice
      },
      compensation: {
        type: 'reject_invoice',
        config: {},
      },
    },
    {
      id: 'authorize_payment',
      name: 'Authorize Payment',
      type: 'approval_workflow',
      config: {
        approver_level: 'finance_manager',
        required_docs: ['invoice', 'receipt', 'po'],
      },
      compensation: {
        type: 'hold_payment',
        config: {},
      },
    },
    {
      id: 'settle_payment',
      name: 'Settle Payment',
      type: 'process_payment',
      config: {
        method: 'bank_transfer',
        posting_to_ledger: true,
      },
      compensation: null, // Payment is irreversible, handle via refund
    },
  ],

  triggers: [
    {
      event: 'purchase_request_created',
      action: 'start_workflow',
    },
  ],
};

/**
 * Procurement step handlers
 */
const procurementHandlers = {
  create_rfq: async (context, config) => {
    // Validate
    for (const field of config.required_fields) {
      if (!context[field]) throw new Error(`Missing ${field}`);
    }
    return {
      rfq_id: `RFQ-${Date.now()}`,
      items: context.items,
      quantity: context.quantity,
      budget: context.budget,
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: 'open',
    };
  },

  send_notifications: async (context, config) => {
    // In production: send via email/SMS service
    return {
      notifications_sent: 5,
      channel: config.channels.join(', '),
      timestamp: new Date(),
    };
  },

  wait_for_bids: async (context, config) => {
    // In production: listen to bid submissions
    return {
      bids_received: 3,
      min_bids_met: true,
      deadline: context.deadline,
      average_price: context.budget * 0.85,
    };
  },

  evaluate_bids: async (context, config) => {
    // Simple scoring logic
    const bids = context.bids_received || 3;
    return {
      winner: 'Supplier-001',
      score: 85,
      price: context.budget * 0.82,
      delivery_days: 5,
      quality_rating: 4.5,
    };
  },

  create_po: async (context, config) => {
    return {
      po_id: `PO-${Date.now()}`,
      supplier: context.winner,
      amount: context.price,
      items: context.items,
      delivery_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'issued',
    };
  },

  track_shipment: async (context, config) => {
    return {
      shipment_id: `SHIP-${Date.now()}`,
      status: 'in_transit',
      location: 'Warehouse',
      estimated_arrival: context.delivery_date,
    };
  },

  quality_check: async (context, config) => {
    return {
      inspection_date: new Date(),
      items_received: context.items,
      items_rejected: 0,
      quality_score: 95,
      status: 'accepted',
    };
  },

  match_invoice: async (context, config) => {
    return {
      po_amount: context.amount,
      invoice_amount: context.amount,
      receipt_quantity: context.items,
      match_status: 'three_way_match_passed',
      approval_recommended: true,
    };
  },

  approval_workflow: async (context, config) => {
    return {
      approval_status: 'approved',
      approved_by: 'Finance Manager',
      approval_date: new Date(),
      approved_amount: context.invoice_amount,
    };
  },

  process_payment: async (context, config) => {
    return {
      payment_id: `PAY-${Date.now()}`,
      amount: context.approved_amount,
      method: 'bank_transfer',
      status: 'processed',
      gl_posting_id: `GL-${Date.now()}`,
      vendor_settlement_id: `VS-${Date.now()}`,
    };
  },

  cancel_rfq: async (context, config) => {
    return {status: 'cancelled', rfq_id: context.rfq_id, reason: 'Compensation'};
  },

  cancel_po: async (context, config) => {
    return {status: 'cancelled', po_id: context.po_id, reason: 'Compensation'};
  },

  create_return: async (context, config) => {
    return {return_id: `RET-${Date.now()}`, reason: config.reason};
  },

  reject_invoice: async (context, config) => {
    return {status: 'rejected', reason: 'Mismatch detected'};
  },

  hold_payment: async (context, config) => {
    return {status: 'on_hold', reason: 'Awaiting reapproval'};
  },
};

module.exports = { procurementFlowDefinition, procurementHandlers };
