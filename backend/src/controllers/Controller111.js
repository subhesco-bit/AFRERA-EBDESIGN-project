export class Controller111 {
  constructor(service) { this.service = service; }
  async handle(req, res) { res.json({ success: true }); }
}
