export class Controller204 {
  constructor(service) { this.service = service; }
  async handle(req, res) { res.json({ success: true }); }
}
