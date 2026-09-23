'use strict';
/** Organic tracing on the same lot body. GST pack stays named.
 * Ported from pine-shadow src/lib/share/trace.ts */

function expected(lot, packed) {
  if (lot.status === 'settled') return ['mint', 'intake', 'process', 'pack', 'offtake'];
  if (packed || lot.status === 'listed') return ['mint', 'intake', 'process', 'pack'];
  if (lot.status === 'in_warehouse' || lot.status === 'pledged') return ['mint', 'intake'];
  return ['mint'];
}

function organicTrace(input) {
  const packed = Boolean(input.packed);
  const path = expected(input.lot, packed);
  const chain = input.giChain.filter((g) => g.lotId === input.lot.id).sort((a, b) => a.seq - b.seq);
  const broken = [];
  if (input.lot.remainingGrams < 0) broken.push('remaining cannot go negative');
  if (input.lot.remainingGrams > input.lot.grams) broken.push('remaining exceeds minted grams');
  if (input.lot.giMinted && !chain.some((g) => g.event === 'mint')) broken.push(`${input.lot.id} expects mint`);
  if ((input.lot.status === 'in_warehouse' || input.lot.status === 'pledged') && !chain.some((g) => g.event === 'intake' || g.event === 'mint')) {
    broken.push(`${input.lot.id} expects mint → intake`);
  }
  if (packed && !input.lot.giMinted) broken.push('pack waits on a minted lot');
  const organic = input.claim;
  if (organic === 'none') broken.push('organic claim undeclared — PGS/NPOP stays named');
  const conserved = broken.length === 0 && organic !== 'none';
  return {
    lotId: input.lot.id, conserved, path, broken, organic, rupee: null, gst: 'missing',
    reason: conserved
      ? `${input.lot.variety} traces ${path.join(' → ')}. ${organic.toUpperCase()} declared. GST invoice missing.`
      : broken[0] ?? 'Organic path named. Do not invent a certificate rupee.',
  };
}

function shareWiring(input) {
  const hoursConserved = input.remainingHours >= 0 && input.remainingHours <= input.capacityHours;
  const organicConserved = input.organic ? input.organic.conserved : false;
  return {
    hoursConserved, organicConserved, gst: 'missing', rentalRupees: 'missing', subsidyAmount: 'missing', rupee: null,
    reason: hoursConserved ? 'Hours conserved. GST invoice missing. Rental rupees missing. Subsidy amount blank.' : 'Hours break named. Do not invent a rent to close it.',
  };
}

module.exports = { organicTrace, shareWiring };
