import Ticket from '../models/ticket.js';

class SupportService {
  static async getAllTickets() {
    return await Ticket.find();
  }

  static async getTicketById(id) {
    return await Ticket.findById(id);
  }

  static async createTicket(ticketData) {
    const newTicket = new Ticket(ticketData);
    return await newTicket.save();
  }

  static async updateTicket(id, updateData) {
    return await Ticket.findByIdAndUpdate(id, updateData, { new: true });
  }

  static async deleteTicket(id) {
    return await Ticket.findByIdAndDelete(id);
  }

  static async getTicketsByStatus(status) {
    return await Ticket.find({ status });
  }

  static async getTicketsByUser(userId) {
    return await Ticket.find({ userId });
  }
}

export default SupportService;