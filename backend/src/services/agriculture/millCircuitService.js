class MillCircuitService {
  async process(data) { return { status: "processed" }; }
}

module.exports = new MillCircuitService();
