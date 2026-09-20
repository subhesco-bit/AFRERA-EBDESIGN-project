export class Controller422 {
  constructor(service) { this.service = service; }
  async handle(req, res) { res.json({ success: true }); }
}
